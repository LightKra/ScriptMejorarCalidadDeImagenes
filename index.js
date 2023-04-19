const fs = require('fs');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
//validaciones
function validarRutaArchivo(ruta) {
    if(fs.existsSync(ruta)){
        return true;
    }else{
        console.log("La ruta no existe");
        return false;
    }
}
//funciones de operaciones del script
function obtenerNombresDeImagenes() {
  if (!fs.existsSync('./image')) {
    fs.mkdirSync('./image');
    console.log('La carpeta image ha sido creada y no hay ninguna imagen.');
    return [];
  }
  
  const nombresArchivos = fs.readdirSync('./image');
  const extensionesValidas = ['.jpg', '.png', '.gif','.jpeg','.jfif']; // Agrega aquí cualquier otra extensión que quieras incluir
  const nombresImagenes = nombresArchivos.filter(nombreArchivo => {
    const extension = nombreArchivo.substring(nombreArchivo.lastIndexOf('.'));
    return extensionesValidas.includes(extension);
  });

  if (nombresImagenes.length === 0) {
    console.log('No se encontraron imágenes en la carpeta image.');
    return [];
  }

  return nombresImagenes;
}

function contarImagenesDeDownload() {
  const files = fs.readdirSync('./download');
  let count = 0;

  files.forEach(file => {
    if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.gif') || file.endsWith('.jfif')) {
      count++;
    }
  });

  return count;
}
async function seleccionarImagen(rutaImagen, nombreImagen) {
  const browser = await puppeteer.launch({
    headless: false,
    launchOptions: 10000
  });
  if (!validarRutaArchivo(rutaImagen)) {
    return;
  }
  if (!fs.existsSync('./')) {
    fs.mkdirSync('./download');
  }
  const page = await browser.newPage();
  await page.goto('https://bigjpg.com/');
  // Hacer clic en el botón que abre el explorador de archivos
  await page.waitForSelector('.btn-success');
  await page.click('.btn-success');
  // Esperar a que aparezca el selector CSS del input de tipo file
  await page.waitForSelector('input[type="file"]');
  // Obtener el input de tipo file
  const input = await page.$('input[type="file"]');
  // Seleccionar la imagen a cargar
  await input.uploadFile(rutaImagen);
  await page.waitForSelector('.btn.btn-sm.btn-primary.big_begin');
  await page.click('.btn.btn-sm.btn-primary.big_begin');
  await page.waitForSelector('.modal-dialog');
  await page.waitForSelector('input[type="radio"]');
  await page.evaluate(() => {
    const opciones = document.querySelectorAll('input[type="radio"]');
    opciones[0].checked = 'checked';
    opciones[3].checked = 'checked';
    opciones[9].checked = 'checked';
  });
  await page.waitForSelector('button[id="big_ok"]');
  await page.evaluate(()=>{
    document.querySelector('button[id="big_ok"]').click();
  });
  await page.waitForTimeout(40000);
  await page.waitForSelector('.btn.btn-sm.btn-success.big_download');
  await page.waitForSelector('.btn.btn-sm.btn-success.big_download');
  const downloadUrl = await page.evaluate(() => {
    return document.querySelectorAll('.btn.btn-sm.btn-success.big_download')[0].href;
  });
  fetch(downloadUrl)
  .then(response => response.buffer())
  .then(buffer => {
    fs.writeFileSync(`${__dirname}/download/${nombreImagen}`, buffer)
    console.log('Descarga completa');
    browser.close();
  }).catch(error =>{
    console.error(error);
    browser.close();
  });
}
function generarImagenesEnHd(){
    const array = obtenerNombresDeImagenes();
    let count = 0;
    let IdInterval = setInterval(()=>{
      const numeroCarpetaDownload = contarImagenesDeDownload();
      if(numeroCarpetaDownload !== 0){
        count = numeroCarpetaDownload;
      }
      seleccionarImagen(`${__dirname}/image/${array[count]}`,array[count]);
      if(count === array.length - 1){
        clearInterval(IdInterval);
      }
      count++;
    },60000);
}
  
generarImagenesEnHd();