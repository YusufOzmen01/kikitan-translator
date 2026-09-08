from github import Github, Auth, InputFileContent
from pathlib import Path
import time

import os
import json

if "GITHUB_API_KEY" not in os.environ:
    raise Exception("GITHUB_API_KEY is required to run this script")

if "TAURI_SIGNING_PRIVATE_KEY" not in os.environ:
    raise Exception("TAURI_SIGNING_PRIVATE_KEY is required to run this script")

if not Path("./announcement_files/en.md").exists():
    raise Exception("Announcement (EN) file not found")

if not Path("./announcement_files/jp.md").exists():
    raise Exception("Announcement (JP) file not found")

if not Path("./announcement_files/kr.md").exists():
    raise Exception("Announcement (KR) file not found")

if not Path("./announcement_files/cn.md").exists():
    raise Exception("Announcement (CN) file not found")

if not Path("./announcement_files/tr.md").exists():
    raise Exception("Announcement (TR) file not found")

auth = Auth.Token(os.getenv("GITHUB_API_KEY"))
g = Github(auth=auth)

print("Updating gist...")
update_str = json.dumps({ 
    "show": True,
    "date": time.strftime("%d %B %Y"),
    "en": open("./announcement_files/en.md", encoding="utf-8").read(),
    "jp": open("./announcement_files/jp.md", encoding="utf-8").read(),
    "kr": open("./announcement_files/kr.md", encoding="utf-8").read(),
    "cn": open("./announcement_files/cn.md", encoding="utf-8").read(),
    "tr": open("./announcement_files/tr.md", encoding="utf-8").read()
})

g.get_gist("0804fb9388f7859b1a549cddc626c39f").edit(files={
    "announcement.json": InputFileContent(update_str)
})

print("Done!")
g.close()