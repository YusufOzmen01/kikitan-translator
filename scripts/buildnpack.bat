cd ..
dotnet build -c Release KikitanTranslator.Photino
vpk pack --packId com.github.yusufozmen01.kikitan-translator --packVersion 2.0.0 --packDir KikitanTranslator.Photino\bin\Release\net10.0\win-x64\ --mainExe KikitanTranslator.Photino.exe --icon KikitanTranslator.Photino\Resources\wwwroot\kikitan_logo.ico --packTitle "Kikitan Translator"