from github import Github, Auth, InputFileContent

from dotenv import load_dotenv
import os
import json

load_dotenv()

if "GITHUB_API_KEY" not in os.environ:
    raise Exception("GITHUB_API_KEY is required to run this script")

if "TAURI_SIGNING_PRIVATE_KEY" not in os.environ:
    raise Exception("GITHUB_API_KEY is required to run this script")

auth = Auth.Token(os.getenv("GITHUB_API_KEY"))
g = Github(auth=auth)

print("Building kikitan...")
os.system("npm run tauri build")

tauri_conf = json.load(open("src-tauri/tauri.conf.json"))
repo = g.get_repo("YusufOzmen01/kikitan-translator")

print("Creating release...")
new_release = repo.create_git_tag_and_release(tauri_conf["version"], tauri_conf["version"], "Kikitan Translator v" + tauri_conf["version"], open("public/changelogs/en.md").read(), repo.get_commits()[0].sha, "commit")

print("Uploading setup...")
new_release.upload_asset(f"src-tauri/target/release/bundle/nsis/Kikitan Translator_{tauri_conf["version"]}_x64-setup.exe", "Kikitan Translator_x64-setup.exe")
print("Uploading update zip...")
new_release.upload_asset(f"src-tauri/target/release/bundle/nsis/Kikitan Translator_{tauri_conf["version"]}_x64-setup.nsis.zip", "Kikitan Translator_x64-setup.nsis.zip")

print("Updating release...")
new_release.update_release(make_latest="true", name=new_release.title, message=new_release.body)

print("Updating gist...")
update_str = json.dumps({ 
    "version": "v" + tauri_conf["version"],
    "platforms": {
        "windows-x86_64": {
            "signature": open(f"src-tauri/target/release/bundle/nsis/Kikitan Translator_{tauri_conf["version"]}_x64-setup.nsis.zip.sig", "r").read(),
            "url": f"https://github.com/YusufOzmen01/kikitan-translator/releases/download/{tauri_conf["version"]}/Kikitan.Translator_{tauri_conf["version"]}_x64-setup.nsis.zip"
        }
    }
})

g.get_gist("2739ef70ee7f4e60add7e5d87a4c745b").edit(files={
    "current_version.json": InputFileContent(update_str)
})

print("Done!")
g.close()