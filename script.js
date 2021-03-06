var canvas = document.getElementsByTagName('canvas')[0];
var canvas2 = document.getElementsByTagName('canvas')[1];
var context = canvas.getContext('2d');
var context2 = canvas2.getContext('2d');
var width = 0, height = 0;
var width2 = 0, height2 = 0;
var lab_target = [,];

var E_s = [0,0,0], E_t = [0,0,0], D_s = [0,0,0], D_t = [0,0,0];

$('#input_s').on('change', (event)=>{
    let reader = new FileReader();
    reader.onload = function(e){
        let img = new Image();
        img.onload = function(){
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            width = img.width;
            height = img.height;
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(event.target.files[0])
});

$('#input_t').on('change', (event)=>{
    let reader = new FileReader();
    reader.onload = function(e){
        let img = new Image();
        img.onload = function(){
            canvas2.width = img.width;
            canvas2.height = img.height;
            context2.drawImage(img, 0, 0);
            width2 = img.width;
            height2 = img.height;
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(event.target.files[0])
});

function CalculateLab(R, G, B){
    R = R < 3 ? 3 / 255 : R / 255;
    G = G < 3 ? 3 / 255 : G / 255;
    B = B < 3 ? 3 / 255 : B / 255;
   
    let L = Math.log10(0.3811 * R + 0.5783 * G + 0.0402 * B);
    let M = Math.log10(0.1967 * R + 0.7244 * G + 0.0782 * B);
    let S = Math.log10(0.0241 * R + 0.1288 * G + 0.8444 * B);

    let lab_l = 0.5774 * L + 0.5744 * M + 0.5744 * S;
    let lab_a = 0.4082 * L + 0.4082 * M - 0.8164 * S;
    let lab_b = 0.7071 * L - 0.7071 * M;
    return [lab_l, lab_a, lab_b];
}

function CalculateRGB(lab_l, lab_a, lab_b){
    let L_t = Math.pow(10, 0.5774 * lab_l + 0.4082 * lab_a + 0.7071 * lab_b);
    let M_t = Math.pow(10, 0.5774 * lab_l + 0.4082 * lab_a - 0.7071 * lab_b);
    let S_t = Math.pow(10, 0.5774 * lab_l - 0.8164 * lab_a);
    let R = 4.4679 * L_t - 3.5873 * M_t + 0.1193 * S_t;
    let G = -1.2186 * L_t + 2.3809 * M_t - 0.1624 * S_t;
    let B = 0.0497 * L_t - 0.2439 * M_t + 1.2045 * S_t;
    R = R > 0.92 ? 0.92 : R;
    G = G > 0.92 ? 0.92 : G;
    B = B > 0.92 ? 0.92 : B;
    return [R, G, B];
}

function CalculateED(img_context, w, h, target){
    let pixel = img_context.getImageData(0,0,1,1).data;
    let total = 0;
    let E_1 = [0,0,0];
    let D_1 = [0,0,0];
    let n = w * h;
    for(let i = 0; i<w; i++){
        for(let j = 0; j<h; j++){
            pixel = img_context.getImageData(i,j,1,1);
            let lab = CalculateLab(pixel.data[0], pixel.data[1], pixel.data[2])
            
            E_1[0] += lab[0];
            E_1[1] += lab[1];
            E_1[2] += lab[2];
        }
    }
    E_1[0] *= (1/n);
    E_1[1] *= (1/n);
    E_1[2] *= (1/n);

    for(let i = 0; i<w; i++){
        for(let j = 0; j<h; j++){
            pixel = img_context.getImageData(i,j,1,1);
            let lab = CalculateLab(pixel.data[0], pixel.data[1], pixel.data[2]);
            D_1[0] += Math.pow((lab[0] - E_1[0]), 2);
            D_1[1] += Math.pow((lab[1] - E_1[1]), 2);
            D_1[2] += Math.pow((lab[2] - E_1[2]), 2);
        }
    }
    D_1[0] = Math.sqrt((1 / n)* D_1[0]);
    D_1[1] = Math.sqrt((1 / n)* D_1[1]);
    D_1[2] = Math.sqrt((1 / n)* D_1[2]);
    return [E_1, D_1];
}
$('#button').on('click', (event)=>{
    let ED_s = CalculateED(context, width, height, false);
    E_s = ED_s[0];
    D_s = ED_s[0];
    let ED_t = CalculateED(context2, width2, height2, true);
    E_t = ED_t[0];
    D_t = ED_t[0];

    for(let i = 0; i<width2; i++){
        for(let j = 0; j<height2; j++){
            pixel = context2.getImageData(i,j,1,1);
            let lab = CalculateLab(pixel.data[0], pixel.data[1], pixel.data[2]);
            let l_new = E_s[0] + ((lab[0] - E_t[0]) * (D_s[0] / D_t[0]));
            let a_new = E_s[1] + ((lab[1] - E_t[1]) * (D_s[1] / D_t[1]));
            let b_new = E_s[2] + ((lab[2] - E_t[2]) * (D_s[2] / D_t[2]));
            let rgb = CalculateRGB(l_new, a_new, b_new);
            pixel.data[0] = parseInt(rgb[0] * 255);
            pixel.data[1] = parseInt(rgb[1] * 255);
            pixel.data[2] = parseInt(rgb[2] * 255);
            context2.putImageData(pixel, i, j)
        }
    }
});