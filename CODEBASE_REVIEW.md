# Codebase review — follow-up

Reviewed on 2026-09-16 against commit `e524241` plus the current local edits. Original finding numbers are retained. Findings 4, 6, 9, 10, 12, 13, 14, 15, and 16 are excluded at the user's request.

This is a source-level recheck. No builds, live API requests, microphone capture, or VR sessions were run. The checks below trace the current code; proposed regression tests have not been executed. Only this document was written. No commits or GitHub actions were performed. The previous review document was absent from the workspace, so this follow-up recreates it.

## Results

| Original finding | Current result |
| --- | --- |
| 1 — WebSocket exposure | Partially fixed: loopback binding removes direct LAN exposure; local access remains unauthenticated and includes credentials. |
| 2 — Desktop capture input | Still present: subsequent buffers are not supplied to the resampler. |
| 3 — Busy loops | Partially fixed: microphone polling awaits its delay; the headless keepalive still spins. |
| 5 — Restart lifecycle | New regression: normal configuration-triggered restarts now stop without restarting. |
| 7 — Chatbox pacing | Wrapper defect fixed; transcription-only pacing still has a zero-length delay. |
| 8 — Translation queue | Partially fixed: mutations are locked; ordering, capacity, worker lifetime, and an unlocked read remain unresolved. |
| 11 — Recognition subscriptions | Bing reconnect subscription growth fixed within one instance, but disposal now leaks its subscription; Gemini reconnect issue remains. |

## 1. WebSocket — direct LAN exposure fixed, local access still unrestricted

**Locations:** `KikitanTranslator.Photino/Connector.cs:19–24,46`; `KikitanTranslator.Photino/Manager.cs` (`SendUpdateToUI`); `KikitanTranslator.Base/Utility/AppConfig.cs` (serialized API-key fields).

Changing the listener to `ws://127.0.0.1:18378` fixes the original all-interface binding. A remote machine cannot connect directly through the host's LAN address under this configuration.

Any local client that can reach the port can still connect without authentication, request state containing configured API keys, invoke the registered control handlers, and receive broadcasts intended for other clients. Origin validation is also absent; browser access depends on the browser's applicable local-network policies, so a browser exploit is not claimed as reproduced.

**Remaining action:** Decide whether all local processes are intentionally trusted. If not, require a session credential, validate browser origins, redact keys from state, and return request-specific responses only to their requester. The original LAN severity should not be carried forward unchanged now that binding is restricted.

## 2. Desktop capture — why the resampler runs out of audio

**Location:** `KikitanTranslator.Base/Capture/Loopback.cs:68–82`.

There are two separate buffers in this method:

- `e.Buffer` contains newly captured **input audio** for this callback.
- `_resampledBuffer` is the **output destination** where converted audio is written.

Increasing the output buffer or calling `Read` again does not supply new input.

On the first callback, this code creates the source:

```csharp
var raw = new RawSourceWaveStream(
    e.Buffer, 0, e.BytesRecorded, _capture.WaveFormat);
```

That source represents a finite region of one byte array. It has a read position and an end. It is then wrapped by the conversion providers and attached to `_resampler`.

On the second callback, the audio format normally has not changed. Consequently, this condition is false:

```csharp
if (_resampler == null || _resamplerSourceFormat != _capture.WaveFormat)
```

The source is not recreated, appended to, or replaced. The new callback's `e.Buffer` never enters the conversion chain. The following `Read` continues reading the source established on the first callback:

```csharp
int bytesRead = _resampler.Read(_resampledBuffer, 0, estimatedBytes);
```

For example, assume callbacks A, B, and C each contain 100 ms of desktop audio:

| Callback | Input received | Input supplied to the resampler |
| --- | --- | --- |
| A | First 100 ms | A finite stream covering A is created. |
| B | Next 100 ms | No new stream data; reads continue from A or buffered conversion output. |
| C | Next 100 ms | Still no new stream data; the original source eventually reaches its end. |

The exact point where output becomes empty depends on buffering inside the resampler. It is not necessarily the second callback. The definite defect is that B and C are never explicitly fed as new input. After the initial source and buffered output are consumed, the converter has no continuing audio to read.

Even if capture reuses the same underlying byte array, replacing its contents does not rewind the source's read position or extend its finite length. Array reuse therefore does not turn this source into a continuous stream; it can also make any unread bytes dependent on callback timing.

**User-visible effect:** Desktop capture events may continue firing, while the recognition pipeline receives empty or incomplete audio and produces little or no desktop translation. A format change can create a fresh source, but that source again covers only one callback.

**Repair direction:** Keep the resampler for continuity, but attach it to a persistent buffered input provider. Append exactly `e.BytesRecorded` bytes from every callback, then read the converted output. Preserve incomplete output frames between callbacks for VAD. Define buffer limits and underflow behavior explicitly so reads do not manufacture unlimited silence or lose queued audio.

Recreating the entire converter for every callback would feed each buffer, but also repeatedly resets conversion state and creates native objects. A continuous input provider better matches continuous capture.

**Proposed verification:** Feed three same-format buffers with clearly different signals, without a real microphone. Verify converted output includes all three signals in sequence, allowing for conversion latency. Also run several seconds of continuous input and check that output duration tracks input duration. Merely checking that `DataAvailable` continues firing will not detect this bug.

## 3. Busy loops — one of two fixed

**Locations:** `KikitanTranslator.Photino/Manager.cs:171`; `KikitanTranslator.Photino/Program.cs:64–67`.

The microphone-monitor task is now async and uses `await Task.Delay(500)`. That loop's original defect is fixed.

The headless loop still contains:

```csharp
while (true) Task.Delay(1000);
```

It creates delay tasks continuously without waiting for them, consuming CPU and allocating timers/tasks while idle. Await the delay in an async delegate or wait on an application-lifetime signal.

**Proposed verification:** Profile idle headless mode and confirm the lifetime worker suspends instead of continuously creating tasks.

## 5. Restart — the added check prevents ordinary restarts

**Location:** `KikitanTranslator.Photino/Manager.cs:281–301`.

The new flow is:

```text
_running is true
→ RestartIfRunning enters its body
→ Stop sets _running to false
→ wait 100 ms
→ if (_running) Start() is skipped
```

No intervening user action is needed. A normal setting change now stops recognition without restarting it. The new check prevents the earlier delayed restart in the simple Stop case, but it also prevents the intended restart.

The same boolean cannot distinguish "stopped temporarily for restart" from "explicitly stopped by the user." If another Start occurs during the delay, the old continuation can instead call Start on an already running session, which requests another restart.

**Remaining action:** Track desired running state separately from actual session state, or use a restart generation/cancellation token. Serialize lifecycle operations and have an explicit Stop invalidate pending restarts. Return `Task` instead of `async void` so callers can observe completion and failure.

**Proposed verification:** Test a configuration change while running, a user Stop during a pending restart, and a new Start during that same interval. Respectively expect one replacement session, no replacement, and only the latest requested session.

## 7. Chatbox — wrapper flag fixed, transcription delay still zero

**Locations:** `KikitanTranslator.Base/Outputs/Custom.cs`; `KikitanTranslator.Photino/Manager.cs:223–229`; `KikitanTranslator.Base/Kikitan.cs:122`.

`Custom` now returns its supplied `isDelayed` flag, and the chatbox wrapper passes true. Ordinary non-Gemini final translations therefore reach the delayed worker as intended. The original wrapper bug is fixed.

The worker still calculates spacing only from `texts[1].Length`, which is the translation. Speech-to-text-only mode sets the translation to an empty string, so even a long transcription produces a zero delay. Use recognized text in that mode, or calculate timing from the actual displayed message.

Gemini's direct-send branch also bypasses the queue and its delay flags. If pacing is intended for Gemini too, it needs to use the same scheduled output path.

**Proposed verification:** Emit two final translated results and confirm configured spacing, then repeat in transcription-only mode. The first path now has the correct wrapper classification; the second still calculates zero spacing.

## 8. Queue — mutation locking helps, but does not finish the repair

**Location:** `KikitanTranslator.Base/Kikitan.cs:81–85,99–125`; `KikitanTranslator.Base/Recognizers/Bing.cs` (recognition `Task.Run` calls).

Both Add and removal now use `_queueLock`, which addresses the original concurrent mutation race. The earlier report should no longer describe these mutations as wholly unprotected.

Remaining issues:

- `_queue.Count` is read outside the lock. Move the empty check and dequeue into the same critical section. With the ordinary single-consumer path this is not by itself proof of an empty-dequeue exception, but it remains an unsynchronized read; multiple workers would make the check/dequeue race more serious.
- Translation still occurs concurrently before enqueueing. A slower first sentence can be delivered after a faster second sentence. The lock preserves completion order, not speech order.
- The queue remains unbounded when incoming results exceed the configured output rate.
- `QueueWorker` remains `async void`. Its asynchronous exceptions cannot be observed by the task created with `Task.Run(QueueWorker)`.
- Output callbacks run while holding `_queueLock`, so a slow output blocks producers. Dequeue under the lock and invoke outputs afterward.
- Shutdown still does not cancel and await in-flight recognition/translation work or the worker. A late result can enqueue or send after the session has stopped.

**Remaining action:** Use an owned, cancellable processing task; atomically dequeue; assign sequence order before concurrent translation if ordered output matters; and define a backlog limit/drop policy.

**Proposed verification:** Use two fake translations whose completion order is reversed, an output that blocks or throws, a burst exceeding the intended backlog limit, and a result completing after Stop.

## 11. Bing — constructor subscription needs a matching disposal unsubscribe

**Locations:** `KikitanTranslator.Base/Recognizers/Bing.cs:35–38,163–180,372–375`; `KikitanTranslator.Base/Recognizers/Gemini.cs:93,144–148`.

Moving Bing's subscription to the constructor fixes repeated subscription on reconnect within one Bing instance. However, the previous unsubscribe was removed from Stop and no matching unsubscribe was added to Dispose.

Manager reuses its microphone capture object across replacement recognizers. The resulting sequence is:

```text
Create Bing A → capture subscribes A
Dispose Bing A → subscription to A remains
Create Bing B → capture subscribes B
Emit one audio frame → both A and B receive it
```

The disposed instance stays reachable through the capture event and attempts to use its disposed WebSocket client. The precise send failure depends on the client implementation, but stale callbacks and retained recognizers follow directly from the subscription lifetime. Repeated Stop/Start cycles accumulate them even if the restart regression in finding 5 is separately fixed.

**Remaining action:** Pair constructor subscription with an unsubscribe in Dispose, with disposal safe against late callbacks. Keeping it subscribed during a reusable Stop/Start cycle is reasonable when disposal reliably ends the subscription.

Bing also still replaces `_client` in Start without disposing the previous client on its internal restart paths. Old callbacks and delayed reconnect continuations need cancellation and ownership checks.

Gemini remains unchanged for this finding: disconnect changes status but does not remove the audio subscription, and a subsequent setup response adds it again. It still needs a single subscription lifetime and coordinated reconnect cleanup.

**Proposed verification:** With a fake capture source, create/dispose several Bing instances and check handler count returns to zero after each disposal. Exercise repeated reconnects on a live instance and confirm exactly one send per frame. Apply the equivalent reconnect test to Gemini.
