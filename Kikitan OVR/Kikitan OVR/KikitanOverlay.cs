using OVRSharp;
using System.Text;
using Valve.VR;
using System.Runtime.InteropServices;
using WebSocketSharp.Server;
using WebSocketSharp;

namespace Kikitan_OVR
{
    internal class KikitanOverlay : WebSocketBehavior
    {
        private Application _app;
        private Overlay _overlay;

        private uint _lci, _rci;

        [DllImport("user32.dll")]
        internal static extern bool OpenClipboard(IntPtr hWndNewOwner);

        [DllImport("user32.dll")]
        internal static extern bool CloseClipboard();

        [DllImport("user32.dll")]
        internal static extern bool SetClipboardData(uint uFormat, IntPtr data);

        [DllImport("user32.dll")]
        static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

        const byte VK_CONTROL = 0x11;
        const byte VK_V = 0x56;
        const uint KEYEVENTF_KEYDOWN = 0x0000;
        const uint KEYEVENTF_KEYUP = 0x0002;

        protected override void OnOpen() 
        {
            _app = new Application(Application.ApplicationType.Overlay);

            _overlay = new Overlay("kikitan-ovr", "Kikitan OVR Connector", false)
            {
                WidthInMeters = 3.8f
            };

            _lci = _app.OVRSystem.GetTrackedDeviceIndexForControllerRole(Valve.VR.ETrackedControllerRole.LeftHand);
            _rci = _app.OVRSystem.GetTrackedDeviceIndexForControllerRole(Valve.VR.ETrackedControllerRole.RightHand);

            var builder = new StringBuilder();
            var err = new ETrackedPropertyError();

            _app.OVRSystem.GetStringTrackedDeviceProperty(_lci, ETrackedDeviceProperty.Prop_ModelNumber_String, builder, 512, ref err);
            Console.WriteLine("Left controller: " + builder.ToString());

            builder.Clear();

            _app.OVRSystem.GetStringTrackedDeviceProperty(_rci, ETrackedDeviceProperty.Prop_ModelNumber_String, builder, 512, ref err);
            Console.WriteLine("Right controller: " + builder.ToString());

            Main();
        }

        protected override void OnMessage(MessageEventArgs e)
        {
            if (e.Data.StartsWith("send-"))
            {
                OpenClipboard(IntPtr.Zero);
                var yourString = e.Data.Substring(5);
                var ptr = Marshal.StringToHGlobalUni(yourString);
                SetClipboardData(13, ptr);
                CloseClipboard();
                Marshal.FreeHGlobal(ptr);

                keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYDOWN, UIntPtr.Zero);
                keybd_event(VK_V, 0, KEYEVENTF_KEYDOWN, UIntPtr.Zero);
                keybd_event(VK_V, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
                keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
            }
        }

        public void Main()
        {
            while (true)
            {
                var _evt = new VREvent_t();
                _app.OVRSystem.PollNextEvent(ref _evt, (uint)System.Runtime.InteropServices.Marshal.SizeOf(typeof(VREvent_t)));

                if (_evt.eventType == 0) continue;

                switch (_evt.eventType)
                {
                    case 200:
                        if (_evt.data.controller.button == 1)
                        {
                            // Send recognition on request to Kikitan
                            Console.WriteLine("SR ON!");

                            Send("SRON");
                        }

                        break;
                    case 201:
                        if (_evt.data.controller.button == 1)
                        {
                            // Send recognition off request to Kikitan
                            Console.WriteLine("SR OFF!");

                            Send("SROFF");
                        }

                        break;
                    default:
                        // Console.WriteLine(string.Format("[DEBUG] Non captured event ({0}): {1}", _evt.eventType, _evt.data.ToString()));

                        break;
                }

                Thread.Sleep(10);
            }
        }
    }
}
