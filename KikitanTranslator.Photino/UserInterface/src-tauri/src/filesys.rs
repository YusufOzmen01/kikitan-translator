use std::fs::File;
use std::io::Write;
use std::{cmp::min, path::Path};

use futures_util::StreamExt;
use reqwest::Client;
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub async fn download_file(app: AppHandle, path: String, url: String) -> Result<(), String> {
    let res = Client::default()
        .get(url.clone())
        .send()
        .await
        .or(Err(format!("Failed to GET from '{}'", &url)))?;

    if res.status() == 404 {
        return Err("URL not found!".to_string());
    }

    let total_size = res
        .content_length()
        .ok_or(format!("Failed to get content length from '{}'", &url))?;

    let mut file =
        File::create(path.clone()).or(Err(format!("Failed to create file '{}'", path)))?;
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();

    while let Some(item) = stream.next().await {
        let chunk = item.or(Err("Error while downloading file".to_string()))?;

        file.write_all(&chunk)
            .or(Err("Error while writing to file".to_string()))?;

        let new = min(downloaded + (chunk.len() as u64), total_size);
        downloaded = new;

        app.emit(
            "file-download-progress",
            ((downloaded as f64 / total_size as f64) * 100.0) as u64,
        )
        .unwrap();
    }

    Ok(())
}

#[tauri::command]
pub async fn extract_zip(zip_path: String, extract_dir: String) -> Result<(), String> {
    zip_extract::extract(
        File::open(&zip_path).or(Err(format!("Failed to open file '{}'", &zip_path)))?,
        Path::new(&extract_dir),
        true,
    )
    .or(Err("Failed to extract zip!".to_string()))
}
