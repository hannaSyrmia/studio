// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
import Log from "@foxglove/log";

const log = Log.getLogger(__filename);
let canvasStream;
let mediaRecorder: MediaRecorder;
let timeout: NodeJS.Timeout;
let videoName: string;
let stopDownload = false;

function downloadVideo(chunks: Blob[]) {
  const blob = new Blob(chunks, { type: "video/webm" });
  const recording_url = URL.createObjectURL(blob);
  const a: HTMLAnchorElement = document.createElement("a");
  a.setAttribute("style", "display: none;");
  a.href = recording_url;
  a.download = `${videoName}.webm`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(recording_url);
    document.body.removeChild(a);
  }, 0);
}

export function recordVideo(
  canvas: HTMLCanvasElement | ReactNull,
  nameOfVideo: string,
  duration?: undefined | number,
): void {
  const chunks: Blob[] = [];
  videoName = nameOfVideo;
  stopDownload = false;
  if (canvas !== ReactNull) {
    canvasStream = canvas.captureStream(60); // fps
    mediaRecorder = new MediaRecorder(canvasStream, { mimeType: "video/webm" });
    mediaRecorder.ondataavailable = (evt) => {
      chunks.push(evt.data);
    };
    if (duration != undefined) {
      timeout = setTimeout(() => {
        mediaRecorder.stop();
        stopDownload = true;
      }, duration * 1000);
    }
    mediaRecorder.onstop = () => {
      downloadVideo(chunks);
    };
    mediaRecorder.start();
  }
}

export function stopRecordVideo(): void {
  stopDownload = true;
  try {
    mediaRecorder.stop();
    clearTimeout(timeout);
  } catch (e) {
    log.error("Stop recording error", e);
  }
}

export function isDownloadStopped(): boolean {
  return stopDownload;
}
