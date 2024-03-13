const now = new Date();

const todayPositions = [
    {
        x: 432,
        y: 35,
        height: 11,
        width: 35,
        text:  now.getFullYear()
    },
    {
        x: 492,
        y: 35,
        height: 11,
        width: 21,
        text:  now.getMonth() + 1
    },
    {
        x: 536,
        y: 35,
        height: 11,
        width: 21,
        text: now.getDate()
    }
]
/**
 * type: input
 *  data: {
 *      text: string
 *  }
 * type: radio
 *  data: {
 *      selectedIndex: number
 *  }
 */
const userData = localStorage.getItem("prof-maker-data") ? JSON.parse(localStorage.getItem("prof-maker-data")) : {};

class Canvas {
    constructor(image, canvas, ctx, hitCtx, elements) {
        this.image = image;
        this.canvas = canvas;
        this.ctx = ctx;
        this.hitCtx = hitCtx;
        this.elements = elements;
    }
    draw(scale, pos) {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hitCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const aspectRatio = this.image.width / this.image.height;

        // Set canvas height (assuming width is set in HTML or CSS)
        this.canvas.height = this.canvas.width / aspectRatio;

        let posX = 0
        let posY = 0;

        // Draw the image to fit the canvas
        if(pos == null) {
            posX = (this.canvas.width / 2) 
            posY = (this.canvas.height / 2) 
        } else {
            posX = pos.x ;
            posY = pos.y;
        }
        
        const offsetX = (posX )// - (scaledWidth / 2) ;
        const offsetY = (posY) //- (scaledHeight / 2) ;

        const dx = (offsetX - offsetX * scale) ;
        const dy = (offsetY - offsetY * scale);

        this.ctx.save();
        // this.ctx.translate(offsetX, offsetY)
        this.ctx.setTransform(scale, 0, 0, scale, dx, dy); // Apply scaling and translation

        // this.ctx.drawImage(this.image, 0, 0, scaledWidth, scaledHeight);
        this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);

        // Draw today
        todayPositions.forEach((p, i) => {
            this.ctx.fillStyle = "black";
            this.ctx.font = "12px 'jk-font', sans-serif";
            this.ctx.fillText(p.text, p.x , p.y  + p.height * 3 / 4, p.width);
        })
        // Draw each element on the hit context
        this.elements.forEach((element) => {
            if(element.type === "input") {
                const shape = new Path2D();
                shape.rect(element.x , element.y  , element.width , element.height );
                this.hitCtx.fillStyle = "rgb(0, 0, 255, 0)";
                this.hitCtx.fill(shape);
                element.shapes = [shape];
                if(userData[element.id] != null) {
                    this.ctx.fillStyle = "black";
                    this.ctx.font = "15px 'jk-font', sans-serif";
                    this.ctx.fillText(userData[element.id].text, element.x , element.y  + element.height * 3 / 4, element.width);
                }
            } else if(element.type === "radio") {
                element.shapes = [ ];
                for( let i = 0; i < element.elements.length; i++) {
                    const p = element.elements[i];
                    const shape = new Path2D();
                    shape.arc(p.x, p.y , element.radius , 0, 2 * Math.PI);
                    this.hitCtx.fillStyle = "rgb(0, 0, 0, 0)";
                    this.hitCtx.fill(shape);
                    element.shapes.push(shape);
                    if(userData[element.id] != null && userData[element.id].selectedIndex === i) {
                        this.ctx.moveTo( p.x + element.radius, p.y ); // This was the line you were looking for
                        this.ctx.arc(p.x, p.y, element.radius, 0, Math.PI * 2, false);
                        this.ctx.strokeStyle = "rgb(0, 0, 0, 1)";;
                        this.ctx.stroke();
                    }
                }
            }
        });
        this.ctx.restore();
    }

    zoom(currentScale, toScale, x = 0, y = 0) {
        let step = 0.1;
        let initScale = currentScale;

        loopFactory(() => {
            if(initScale < toScale) {
                currentScale = currentScale + step
            } else {
                currentScale = currentScale - step
            }
            this.draw(currentScale, { x: x, y: y});
        }, ()=> {
            if(initScale < toScale) {
                return currentScale > toScale
            } 
            return currentScale < toScale
        }, 25)
    }
}

function loopFactory(func, stopFunc, interval = 25) {
    let handler = {};
    let loop = function(){
        func();
        // reserve next call
        handler.id = setTimeout(loop, interval);
        if(stopFunc()) {
            clearTimeout(handler.id);
        }
    }
    setTimeout(loop, interval);
}

function onTextInputClick(canvasArea, x, y) {
    // zoom in
    const scale = 1.6; // Increase the scale factor by 10%
    const self = this;
    const dx = (this.x - this.x * scale) ;
    const dy = (this.y - this.y * scale);
    const posX = (this.x * scale) + dx; // Adjust position by also considering dx
    const posY = (this.y * scale) + dy; // Adjust position by also considering dy

    canvasArea.zoom(1, scale, this.x, this.y)

    if(document.getElementById('one-line-input')) {
        return
    }
    // show input tag
    const input = document.createElement('input');
    input.id = "one-line-input"
    input.type = 'text';
    input.style.position = 'absolute';
    input.style.left = posX + 'px'; // Position the input tag at the x position of the element
    input.style.top = posY + 'px'; // Position the input tag at the y position of the element
    input.style.width = this.width * scale + 'px'; // Set the width of the input tag to the width of the element
    input.style.height = this.height * scale + 'px'; // Set the width of the input tag to the width of the element
    input.style.borderWidth = '0px'; // Set the width of the input tag to the width of the element
    input.value = userData[this.id] != null ? userData[this.id].text : "";

    const mainContainer = document.getElementById('container');
    function reset() {
        mainContainer.removeChild(input);
        canvasArea.zoom(scale, 1, 0, 0)
    }

    let composing = false;

    input.addEventListener('compositionstart', function() {
        composing = true;
    });

    input.addEventListener('compositionend', function() {
        composing = false;
    });

    input.addEventListener('keydown', function(event) {
        if (!composing) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Prevent default action
                // Implement submission logic here
                // self.inputtedText = input.value;
                userData[self.id] = { text: input.value }
                mainContainer.removeChild(input);
                // Reset zoom or other actions
                localStorage.setItem("prof-maker-data", JSON.stringify(userData))
                canvasArea.zoom(scale, 1, 0, 0)
            } else if (event.key === 'Escape') {
                mainContainer.removeChild(input);
                // Reset zoom or other actions
                canvasArea.zoom(scale, 1, 0, 0)
            }
        }
    })

    input.addEventListener('focusout', function(event) {
        reset();
    });

    setTimeout(() => {
        mainContainer.appendChild(input);
        input.focus(); // Defer focusing until the stack clears
    }, 300)
}

function onTextareaClick(canvasArea) {
    // zoom in
    const scale = 1.6; 
    const self = this;
    const height = this.height * scale;
    const dx = (this.x - this.x * scale) ;
    const dy = (this.y - this.y * scale);
    const posX = (this.x * scale) + dx; // Adjust position by also considering dx
    const posY = (this.y * scale) + dy; // Adjust position by also considering dy

    canvasArea.zoom(1, scale, this.x, this.y)

    // show input tag
    const textarea = document.createElement('textarea');
    textarea.id = "multi-lines-input"
    textarea.style.position = 'absolute';
    textarea.style.left = posX + 'px'; // Position the input tag at the x position of the element
    textarea.style.top = posY + 'px'; // Position the input tag at the y position of the element
    textarea.style.width = this.width * scale + 'px'; // Set the width of the input tag to the width of the element
    textarea.style.height = height + 'px'; // Set the width of the input tag to the width of the element
    textarea.style.maxHeight = height + 'px'; // Set the width of the input tag to the width of the element
    textarea.style.borderWidth = '0px'; // Set the width of the input tag to the width of the element
    textarea.style.resize = 'none'; // Set the width of the input tag to the width of the element
    textarea.focus();
    textarea.value = userData[this.id] != null ? userData[this.id].text : "";

    const mainContainer = document.getElementById('container');

    function reset() {
        mainContainer.removeChild(textarea);
        canvasArea.zoom(scale, 1, 0, 0)
    }


    let composing = false;

    textarea.addEventListener('compositionstart', function() {
        composing = true;
    });

    textarea.addEventListener('compositionend', function() {
        composing = false;
    });

    textarea.addEventListener('keydown', function(event) {
        if (!composing) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Prevent default action
                userData[self.id] = { text: textarea.value }
                localStorage.setItem("prof-maker-data", JSON.stringify(userData))
                reset()
            } else if (event.key === 'Escape') {
                reset()
            }
        }
        if (this.scrollHeight > this.offsetHeight) {
            //   If content exceeds max height, trim the text
            while (this.scrollHeight > this.offsetHeight && this.value.length > 0) {
                textarea.value = this.value.substring(0, this.value.length - 1);
            }
        }
    });
    setTimeout(() => {
        mainContainer.appendChild(textarea);
        textarea.focus(); // Defer focusing until the stack clears
    }, 300)
}


function onRadioClick(canvasArea, x, y, hitCtx) {
    for(let i = 0; i < this.shapes.length; i++) {
        const s = this.shapes[i];
        if(hitCtx.isPointInPath(s, x, y)) {
            userData[this.id] = {selectedIndex: i};
        }
    }

    canvasArea.draw(1)
}

window.onload = function () {
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");
    const hitCtx = canvas.getContext("2d");
    const image = new Image();


    const canvasArea = new Canvas(image, canvas, ctx, hitCtx, elements);

    image.onload = function () {
        canvasArea.draw(1)
        setTimeout(() => {
            canvasArea.draw(1)
        }, 100)
    };

    image.src = "./prof.png";

    canvas.addEventListener("mousemove", function (event) {
    });

    canvas.addEventListener("click", function (event) {
        // Retrieve the clicked coordinates
        const x = event.offsetX;
        const y = event.offsetY;

        for (var i = elements.length - 1; i >= 0; i--) {
            // todo: refactor
            if (elements[i]) {
                for (var j = 0; j < elements[i].shapes.length; j++) {
                    if (hitCtx.isPointInPath(elements[i].shapes[j], x, y)) {
                        elements[i].onClick && elements[i].onClick(canvasArea, x, y, hitCtx);
                        return;
                    }
                }
            } else {
                canvas.style.cursor = "default";
            }
        }
    });

    document.getElementById("download").addEventListener("click", function () {
        downloadCanvasAsPNG(canvas, 'my-prof.png');
    })
};

function downloadCanvasAsPNG(canvas, filename) {
    // Get the canvas element by its ID
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    // Convert the canvas to a data URL for the PNG image
    var imageUrl = canvas.toDataURL('image/png');

    // Create a temporary anchor (a) element and set its href to the image URL
    var downloadLink = document.createElement('a');
    downloadLink.href = imageUrl;

    // Set the download attribute of the anchor to the desired filename
    downloadLink.download = filename;

    // Append the anchor to the document body temporarily
    document.body.appendChild(downloadLink);

    // Trigger the download by simulating a click on the anchor
    downloadLink.click();

    // Remove the anchor from the document body to clean up
    document.body.removeChild(downloadLink);
}




const elements = [
    {
        id: "call-by-name",
        type: "radio",
        elements: [
            {
                x: 110,
                y: 81,
            },
            {
                x: 162,
                y: 81,
            }
        ],
        radius: 10,
        shapes: [],
        onClick: onRadioClick,
    },
    {
        id: "name",
        x: 250,
        y: 73,
        width: 120,
        height: 18,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "birthdate-year",
        x: 78,
        y: 104,
        width: 49,
        height: 13,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "birthdate-month",
        x: 152,
        y: 104,
        width: 16,
        height: 13,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "birthdate-date",
        x: 198,
        y: 104,
        width: 16,
        height: 13,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "zodiac_sign",
        x: 198,
        y: 104,
        width: 16,
        height: 13,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "zodiac_sign",
        x: 298,
        y: 104,
        width: 45,
        height: 13,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "blood_type",
        x: 148,
        y: 134,
        width: 28,
        height: 13,
        type: "input",
        inputtedText: "",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "dominant_hand",
        type: "radio",
        elements: [
            {
                x: 309,
                y: 142,
            },
            {
                x: 339,
                y: 143,
            }
        ],
        radius: 10,
        shapes: [],
        onClick: onRadioClick,
    },
    {
        id: "nickname",
        x: 178,
        y: 162,
        width: 115,
        height: 14,
        type: "input",
        inputtedText: "",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "personality",
        x: 147,
        y: 191,
        width: 147,
        height: 15,
        type: "input",
        inputtedText: "",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "your-day-off",
        x: 163,
        y: 221,
        width: 160,
        height: 15,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "twitter-account",
        x: 489,
        y: 208,
        width: 80,
        height: 15,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "insta-account",
        x: 498,
        y: 227,
        width: 75,
        height: 15,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "hobby",
        x: 83,
        y: 274,
        width: 136,
        height: 46,
        type: "input",
        shapes: [],
        onClick: onTextareaClick
    },
    {
        id: "superpower",
        x: 244,
        y: 272,
        width: 136,
        height: 46,
        type: "input",
        shapes: [],
        onClick: onTextareaClick
    },
    {
        id: "my-boom",
        x: 83,
        y: 344,
        width: 136,
        height: 46,
        type: "input",
        shapes: [],
        onClick: onTextareaClick
    },
    {
        id: "occupation",
        x: 243,
        y: 343,
        width: 136,
        height: 46,
        type: "input",
        shapes: [],
        onClick: onTextareaClick
    },
    {
        id: "birthplace",
        x: 489,
        y: 280,
        width: 88,
        height: 16,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "siblings",
        x: 489,
        y: 306,
        width: 88,
        height: 16,
        type: "input",
        inputtedText: "",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "height",
        x: 489,
        y: 333,
        width: 88,
        height: 16,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "shoe-size",
        x: 489,
        y: 359,
        width: 88,
        height: 16,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "moment-feeling-adult",
        x: 305,
        y: 422,
        width: 272,
        height: 18,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "moment-feeling-happy",
        x: 305,
        y: 449,
        width: 272,
        height: 18,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "moment-feeling-happy",
        x: 305,
        y: 477,
        width: 272,
        height: 18,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-food",
        x: 86,
        y: 557,
        width: 114,
        height: 19,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-drink",
        x: 210,
        y: 557,
        width: 114,
        height: 19,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-place",
        x: 331,
        y: 557,
        width: 114,
        height: 19,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-character",
        x: 456,
        y: 557,
        width: 114,
        height: 19,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-color",
        x: 87,
        y: 593,
        width: 114,
        height: 19,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-pattern",
        x: 210,
        y: 593,
        width: 114,
        height: 19,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-smell",
        x: 331,
        y: 593,
        width: 114,
        height: 19,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-smell",
        x: 456,
        y: 593,
        width: 114,
        height: 19,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-animal",
        x: 87,
        y: 628,
        width: 114,
        height: 19,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-sport",
        x: 210,
        y: 628,
        width: 114,
        height: 19,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-music",
        x: 331,
        y: 628,
        width: 114,
        height: 19,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-book",
        x: 456,
        y: 628,
        width: 114,
        height: 19,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "my-best-three",
        x: 95,
        y: 680,
        width: 130,
        height: 23,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "my-best-three-first",
        x: 100,
        y: 723,
        width: 146,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "my-best-three-second",
        x: 100,
        y: 760,
        width: 146,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "my-best-three",
        x: 100,
        y: 797,
        width: 146,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "gift-i-want",
        x: 320,
        y: 695,
        width: 106,
        height: 50,
        type: "input",
        shapes: [],
        onClick: onTextareaClick
    },
    {
        id: "thing-i-want-try",
        x: 435,
        y: 695,
        width: 106,
        height: 50,
        type: "input",
        shapes: [],
        onClick: onTextareaClick
    },
    {
        id: "thing-i-want-best",
        x: 355,
        y: 774,
        width: 106,
        height: 50,
        type: "input",
        shapes: [],
        onClick: onTextareaClick
    },
    {
        id: "last-best-memory",
        x: 466,
        y: 774,
        width: 106,
        height: 50,
        type: "input",
        shapes: [],
        onClick: onTextareaClick
    },
    {
        id: "if-could-be-reborn",
        x: 653,
        y: 60,
        width: 100,
        height: 58,
        type: "input",
        shapes: [],
        onClick: onTextareaClick
    },
    {
        id: "if-could-use-magic",
        x: 777,
        y: 60,
        width: 100,
        height: 58,
        type: "input",
        shapes: [],
        onClick: onTextareaClick
    },
    {
        id: "if-could-have-month",
        x: 902,
        y: 60,
        width: 100,
        height: 58,
        type: "input",
        shapes: [],
        onClick: onTextareaClick
    },
    {
        id: "if-could-have-million",
        x: 1023,
        y: 60,
        width: 100,
        height: 58,
        type: "input",
        shapes: [],
        onClick: onTextareaClick
    },
    {
        id: "favorite-onigiri-filling",
        x: 632,
        y: 201,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-sushi",
        x: 756,
        y: 201,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-hardness-pudding",
        x: 879,
        y: 201,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-sunny-side-up",
        x: 1002,
        y: 201,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-ramen",
        x: 632,
        y: 249,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-hotness-curry",
        x: 756,
        y: 249,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-alcohol",
        x: 879,
        y: 249,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-snack",
        x: 1002,
        y: 249,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-nabe",
        x: 632,
        y: 299,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-miso-soup",
        x: 756,
        y: 299,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-oden",
        x: 879,
        y: 299,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-thickness-pizza",
        x: 1002,
        y: 299,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-bean-paste",
        x: 632,
        y: 343,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-taiyaki-part",
        x: 756,
        y: 343,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-sunny-side-up-topping",
        x: 879,
        y: 343,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "favorite-tonkatsu-sauce",
        x: 1002,
        y: 343,
        width: 113,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "allergy-food",
        x: 632,
        y: 391,
        width: 300,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "the-last-supper",
        x: 943,
        y: 391,
        width: 172,
        height: 25,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "which-side-dog-cat-other",
        type: "radio",
        elements: [
            {
                x: 716,
                y: 489,
            },
            {
                x: 756,
                y: 489,
            },
            {
                x: 822,
                y: 489,
            }
        ],
        radius: 10,
        shapes: [],
        onClick: onRadioClick,
    },
    {
        id: "which-side-in-or-out",
        type: "radio",
        elements: [
            {
                x: 731,
                y: 511,
            },
            {
                x: 822,
                y: 511,
            },
        ],
        radius: 10,
        shapes: [],
        onClick: onRadioClick,
    },
    {
        id: "which-side-rice-or-bread",
        type: "radio",
        elements: [
            {
                x: 725,
                y: 536,
            },
            {
                x: 788,
                y: 536,
            },
        ],
        radius: 10,
        shapes: [],
        onClick: onRadioClick,
    },
    {
        id: "which-side-immediate-or-accumulate-messages",
        type: "radio",
        elements: [
            {
                x: 741,
                y: 560,
            },
            {
                x: 847,
                y: 561,
            },
        ],
        radius: 10,
        shapes: [],
        onClick: onRadioClick,
    },
    {
        id: "which-side-kinoko-or-takenoko",
        type: "radio",
        elements: [
            {
                x: 699,
                y: 590,
            },
            {
                x: 806,
                y: 590,
            },
        ],
        radius: 10,
        shapes: [],
        onClick: onRadioClick,
    },
    {
        id: "can-ride-roller-coaster",
        type: "radio",
        elements: [
            {
                x: 738,
                y: 610,
            },
            {
                x: 813,
                y: 612,
            },
        ],
        radius: 10,
        shapes: [],
        onClick: onRadioClick,
    },
    {
        id: "done-hurusato-tax",
        type: "radio",
        elements: [
            {
                x: 762,
                y: 636,
            },
            {
                x: 841,
                y: 636,
            },
        ],
        radius: 10,
        shapes: [],
        onClick: onRadioClick,
    },
    {
        id: "cool-image-person",
        x: 949,
        y: 500,
        width: 63,
        height: 38,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "cute-image-person",
        x: 1042,
        y: 500,
        width: 63,
        height: 38,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "hilarious-image-person",
        x: 949,
        y: 561,
        width: 63,
        height: 38,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "unintentionally-funny-image-person",
        x: 1042,
        y: 561,
        width: 63,
        height: 38,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "fashionable-image-person",
        x: 949,
        y: 618,
        width: 63,
        height: 38,
        type: "input",
        shapes: [],
        onClick: onTextInputClick
    },
    {
        id: "free-space",
        x: 620,
        y: 711,
        width: 515,
        height: 125,
        type: "input",
        shapes: [],
        onClick: onTextareaClick
    },
];