# Download everything — Windows

1. Sign in to your GitHub account and open **https://github.com/knownuser0020-svg/EMP**.
2. Click the green **Code** button, then **Download ZIP**. This downloads the complete repository, including source, setup guide, and all Windows bundle parts.
3. Right-click the downloaded `EMP-main.zip` and choose **Extract All**. Open the extracted `EMP-main` folder. Do not run files directly inside the ZIP preview.
4. Your full project source is already in this folder. A separate source-only archive is also in `downloads/EMP-source.zip`.
5. Double-click **PREPARE-WINDOWS-BUNDLES.cmd**. Wait until it prints **DONE**. It joins the bundled parts and verifies their SHA-256 hashes. It does not install software or change PowerShell execution policy.
6. Open the **downloads** folder. You now have **Admin-Windows-x64.zip** and **Employee-Windows-x64.zip**.
7. Right-click each Windows ZIP and choose **Extract All** into separate folders.
8. Inside the extracted Admin folder, open **Admin.exe**. Inside the Employee folder, open **Employee.exe**. Keep each EXE with all its neighboring files and folders.
9. Read **README.md** for API/database setup. These local test bundles use the API address `http://127.0.0.1:8080`, so the backend must run on the same Windows computer. Rebuild them with your HTTPS API address for deployment.

The bundles are unsigned and have not been executed on Windows in this Linux environment. The `Admin.exe` and `Employee.exe` files are applications with adjacent resources, not single-file installers.

## If the double-click preparation fails

You can join the parts without a script. Open Command Prompt in the extracted repository and run:

```bat
copy /b downloads\Admin-Windows-x64.zip.part-01+downloads\Admin-Windows-x64.zip.part-02+downloads\Admin-Windows-x64.zip.part-03+downloads\Admin-Windows-x64.zip.part-04 downloads\Admin-Windows-x64.zip
copy /b downloads\Employee-Windows-x64.zip.part-01+downloads\Employee-Windows-x64.zip.part-02+downloads\Employee-Windows-x64.zip.part-03+downloads\Employee-Windows-x64.zip.part-04 downloads\Employee-Windows-x64.zip
```

Then extract both resulting ZIP files. Prefer the supplied preparation command, which verifies the hashes as well as joining the parts.
