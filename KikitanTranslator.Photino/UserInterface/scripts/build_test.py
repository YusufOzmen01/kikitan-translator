import os

import os
import shutil

print("Building overlay...")
ret = os.system("dotnet build \"src-overlay/Desktop Image Overlay\" -c release")
if ret != 0:
    raise Exception("Failed to build overlay")

shutil.rmtree("src-tauri/desktopoverlay")
shutil.copytree("src-overlay/Desktop Image Overlay/bin/Release/net9.0-windows/", "src-tauri/desktopoverlay")

print("Building kikitan...")
ret = os.system("npm run tauri build -- -c scripts\\tauri.test.json")
if ret != 0:
    raise Exception("Failed to build kikitan")