"use strict";

var txt2canvas = {};

// set the canvas to mimic a fullscreen movie story
txt2canvas.setCanvas = (canvasElementName) => {
  // remove old canvas in the case of repeated JS edit, copy, paste, console run
  const oldCanvas = document.getElementById(canvasElementName);
  if (oldCanvas !== null) {
    oldCanvas.remove();
  }

  // create the canvas and style it
  const canvas = document.createElement("canvas");
  canvas.setAttribute("id", canvasElementName);
  canvas.style.position = "fixed";
  canvas.style.top = "0px";
  canvas.style.left = "0px";
  canvas.style.bottom = "0px";
  canvas.style.right = "0px";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.display = "block";
  canvas.style.zIndex = "2147483648";
  canvas.style.background = "#000";
  document.getElementsByTagName("body")[0].appendChild(canvas);
  const newlyCreatedCanvasNode = document.getElementById(canvasElementName);
  newlyCreatedCanvasNode.setAttribute(
    "width",
    newlyCreatedCanvasNode.clientWidth
  );
  newlyCreatedCanvasNode.setAttribute(
    "height",
    newlyCreatedCanvasNode.clientHeight
  );
};

// extract texts from the page given a minimum text length
txt2canvas.getTexts = (minimumTextLength = 30) =>
  document
    .getElementsByTagName("body")[0]
    .innerText.split("\n")
    .map((item) => item.trimStart())
    .map((item) => item.trimEnd())
    .filter((item) => item.length > minimumTextLength);

txt2canvas.transformTextsIntoSlides = (
  canvasElementName,
  texts,
  readWordsPerMinute,
  padding,
  fontHeight
) => {
  const canvasNode = document.getElementById(canvasElementName);
  if (canvasNode === null) {
    console.error("Canvas node does not exist as expected");
    return;
  }

  const context = canvasNode.getContext("2d");

  let i, j, k, l;
  const slides = [];
  const maxLinesPerSlide = txt2canvas.getMaxLinesPerSlide(
    canvasNode.height,
    fontHeight,
    padding
  );

  context.font = fontHeight + "px courier";
  context.textAlign = "left";
  context.fillStyle = "white";
  context.textBaseline = "top";

  // test with an extra long text right on the first text/slides
  //   texts[0] +=
  //     " --- extra long text test with duplicated content: " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0] +
  //     " " +
  //     texts[0];

  for (i = 0; i < texts.length; i++) {
    const maxLineWidth = canvasNode.width;
    const fullTextWords = texts[i].split(" ");
    let remainingTextWords = fullTextWords;

    const textLines = [];

    // split text[i] into lines this way:
    // remove words one by one until partial text fits the max line width
    // then place everything left in a remaining text holder
    // until no more remaining words
    do {
      for (j = remainingTextWords.length - 1; j >= 0; j--) {
        const potentialLineWordsText = remainingTextWords
          .slice(0, j + 1)
          .join(" ");
        const potentialLineWordsTextMeasuredWidth = context.measureText(
          potentialLineWordsText
        ).width;
        if (potentialLineWordsTextMeasuredWidth < maxLineWidth - padding * 2) {
          // we found a line that fits on the screen width
          textLines.push(potentialLineWordsText);
          remainingTextWords = remainingTextWords.slice(j + 1);
          break;
        }
      }
      //console.log('remainingTextWords=',remainingTextWords);
    } while (remainingTextWords.length > 0);

    // for very long texts the number of lines will not fit a single screen
    // therefore we create slides with the remainder of lines by grouping
    // lines into chunks of maximum lines number that fit on the screen

    const currentTextSlidesCount = Math.ceil(
      textLines.length / maxLinesPerSlide
    );

    for (k = 0; k < currentTextSlidesCount; k++) {
      const slideLines = [];
      let slideWordsLength = 0;
      let slideDurationMiliseconds = null;

      for (
        l = k * maxLinesPerSlide;
        l < k * maxLinesPerSlide + Math.min(maxLinesPerSlide, textLines.length);
        l++
      ) {
        if (textLines[l] === undefined) break; //non-existent line
        // old fillText
        slideLines.push(textLines[l]);
        slideWordsLength += textLines[l].split(" ").length;
      }

      slideDurationMiliseconds =
        (60 * 1000 * slideWordsLength) / readWordsPerMinute;

      const slide = {
        lines: slideLines,
        duration: slideDurationMiliseconds,
      };

      slides.push(slide);
    }
  }

  return slides;
};

txt2canvas.startRecording = (canvasElementName, recordingMiliseconds) => {
  const canvasNode = document.getElementById(canvasElementName);
  if (canvasNode === null) {
    console.error("Canvas node does not exist as expected");
    return;
  }

  const stream = canvasNode.captureStream();
  const mediaRecorder = new MediaRecorder(stream);
  const chunks = [];

  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.onstop = (e) => {
    txt2canvas.showRecordingDownloadLink(
      canvasElementName,
      new Blob(chunks, { type: "video/webm" })
    );
  };

  mediaRecorder.start();
  setTimeout(() => mediaRecorder.stop(), recordingMiliseconds);
};

txt2canvas.showRecordingDownloadLink = (canvasElementName, blob) => {
  // remove old video wrapper in the case of repeated JS edit, copy, paste, console run
  const oldVideoWrapperNode = document.getElementById(
    "txt2canvas-video-wrapper"
  );
  if (oldVideoWrapperNode !== null) {
    oldVideoWrapperNode.remove();
  }

  // create the video wrapper
  const videoWrapperNode = document.createElement("div");
  videoWrapperNode.setAttribute("id", canvasElementName + "-video-wrapper");
  videoWrapperNode.style.position = "fixed";
  videoWrapperNode.style.top = "0px";
  videoWrapperNode.style.left = "0px";
  videoWrapperNode.style.bottom = "0px";
  videoWrapperNode.style.right = "0px";
  videoWrapperNode.style.width = "100%";
  videoWrapperNode.style.height = "100%";
  videoWrapperNode.style.display = "table";
  videoWrapperNode.style.zIndex = "2147483649";
  videoWrapperNode.style.background = "#000";
  videoWrapperNode.style.textAlign = "center";
  document.getElementsByTagName("body")[0].appendChild(videoWrapperNode);

  // create the video node from which we need the link for download
  const videoNode = document.createElement("video");
  videoNode.style.display = "none";
  videoNode.src = URL.createObjectURL(blob);
  videoNode.controls = true;

  videoWrapperNode.appendChild(videoNode);

  // create the download link node
  const downloadLink = document.createElement("a");
  downloadLink.textContent = "Download as .webm video";
  downloadLink.style.color = "#fff";
  downloadLink.style.verticalAlign = "middle";
  downloadLink.style.display = "table-cell";
  downloadLink.href = videoNode.src;
  downloadLink.download = "txt2canvas-video.webm";

  videoWrapperNode.appendChild(downloadLink);
};

// play an array of slides
txt2canvas.playSlides = async (
  canvasElementName,
  slides = [],
  padding,
  fontHeight,
  fadeMiliseconds
) => {
    let took = 0;
  const canvasNode = document.getElementById(canvasElementName);
  if (canvasNode === null) {
    console.error("Canvas node does not exist as expected");
    return;
  }

  const maxLinesPerSlide = txt2canvas.getMaxLinesPerSlide(
    canvasNode.height,
    fontHeight,
    padding
  );
  const context = canvasNode.getContext("2d");
  let i = 0,
    fadeInOpacity = 0,
    fadeOutOpacity = 100,
    fadeStep = fadeMiliseconds / 100;

  // prepare the callback for requestAnimationFrame() to display slides on canvas
  const fnRequestAnimationFrame = () => {
    // recursion exit condition
    if (slides[i] === undefined) {
      return;
    }

    // determine and set the slide's opacity conditionally
    if (fadeInOpacity >= 0 && fadeInOpacity < 100) {
      context.globalAlpha = fadeInOpacity / 100;
      fadeInOpacity += fadeStep;
    } else if (fadeOutOpacity <= 100 && fadeOutOpacity > 0) {
      context.globalAlpha = fadeOutOpacity / 100;
      fadeOutOpacity -= fadeStep;
    } else {
      context.globalAlpha = 1.0;
    }

    // clear screen
    context.clearRect(0, 0, canvasNode.width, canvasNode.height);
    let verticalAlignMiddleOffset =
      (fontHeight + padding) *
      Math.max(
        0,
        Math.floor((maxLinesPerSlide - slides[i].lines.length) / 2 - 1)
      );
    let xPos = padding;

    // draw the slide lines
    for (let j = 0; j < slides[i].lines.length; j++) {
      let yPos =
        verticalAlignMiddleOffset + padding + (j % maxLinesPerSlide) * padding;
      context.fillText(slides[i].lines[j], xPos, yPos);
    }

    // determine and set the requestAnimationFrameTimeout conditionally
    let requestAnimationFrameTimeout;
    if (fadeInOpacity >= 0 && fadeInOpacity < 100) {
      // fade in started and not yet finished
      requestAnimationFrameTimeout = fadeMiliseconds / 100;
      took += requestAnimationFrameTimeout
    } else if (fadeInOpacity === 100 && fadeOutOpacity === 100) {
      // fade in finished
      requestAnimationFrameTimeout = slides[i].duration;
      took += requestAnimationFrameTimeout
    } else if (fadeOutOpacity <= 100 && fadeOutOpacity >= 0) {
      // fade out started and not yet finished
      requestAnimationFrameTimeout = fadeMiliseconds / 100;
      took += requestAnimationFrameTimeout
    }

    setTimeout(() => {
      // move to next slide only when fadeOutOpacity reaches 0
      if (fadeOutOpacity === 0) {
        i++;
        fadeInOpacity = 0;
        fadeOutOpacity = 100;
      }
      requestAnimationFrame(fnRequestAnimationFrame);
    }, requestAnimationFrameTimeout);
  };

  requestAnimationFrame(fnRequestAnimationFrame);
};

txt2canvas.getMaxLinesPerSlide = (canvasHeight, fontHeight, padding) => {
  return Math.floor(canvasHeight / (fontHeight + padding / 2)) - 1;
};

txt2canvas.run = (
  canvasElementName = "txt2canvas-canvas",
  minimumTextLength = 100,
  readWordsPerMinute = 300,
  padding = 40,
  fontHeight = 20
) => {
  txt2canvas.setCanvas(canvasElementName);
  const texts = txt2canvas.getTexts(minimumTextLength);
  const slides = txt2canvas.transformTextsIntoSlides(
    canvasElementName,
    texts,
    readWordsPerMinute,
    padding,
    fontHeight
  );

  const fadeMiliseconds = 1000;
  const recordingMiliseconds =
    slides.reduce((acc, slide) => acc + slide.duration, 0) +
    slides.length * 2 * fadeMiliseconds;

  txt2canvas.startRecording(canvasElementName, recordingMiliseconds);

  txt2canvas.playSlides(
    canvasElementName,
    slides,
    padding,
    fontHeight,
    fadeMiliseconds
  );
};

txt2canvas.run();
