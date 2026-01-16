
//import {saveProject}

// const exporters = {
//   nc: geometryToIso,
//   pxy: geometryToIso,
//   //json: saveProject,
//   svg: geometryToSvg,
// };

// "Save As..." → returns a FileSystemFileHandle for later reuse
// export async function saveAs(data) {
//   const options = {
//     suggestedName: 'untitled',
//     types: [
//       {
//         description: 'Text file',
//         accept: { 'text/plain': ['.nc','.pxy'] },
//       },
//       {
//         description: 'JSON file',
//         accept: { 'application/json': ['.json'] },
//       },
//       {
//         description: 'SVG file',
//         accept: { 'image/svg+xml': ['.svg'] },
//       },
//     ],
//   };

//   try {
//     let handle = await window.showSaveFilePicker(options);
//     let fileName = handle.name;

//     // Auto-append default extension if missing
//     if (!/\.[^.]+$/.test(fileName)) {
//       const defaultExt = 'json'; // e.g. ".txt"
//       fileName += defaultExt;
//       //console.log(`Added default extension: ${defaultExt}`);
//     }

//     // Determine type from extension
//     const ext = fileName.split('.').pop().toLowerCase();
//     // Generate content depending on extension
//     const exporter = exporters[ext];
//     if (!exporter) {
//       alert(`No exporter registered for .${ext}`);
//       return null;
//     }
//     // Generate data specifically for this type
//     const content = await exporter(data);

//     // Write to file
//     const writable = await handle.createWritable();
//     await writable.write(content);
//     await writable.close();

//     console.log(`✅ Saved as ${fileName}`);

//     // Return the handle so the app can re-save without showing picker again
//     return handle;

//   } catch (err) {
//     if (err.name === 'AbortError') {
//       console.log('❌ Save canceled by user.');
//     } else {
//       console.error('💥 Save failed:', err);
//     }
//     return null;
//   }
// }

// Example "Save" function (reuses previous file handle)
// async function save(handle) {
//   if (!handle) {
//     console.warn('No existing file handle — calling saveAs() instead.');
//     return await saveAs();
//   }

//   const writable = await handle.createWritable();
//   const ext = handle.name.split('.').pop().toLowerCase();

//   switch (ext) {
//     case 'nc':
//     case 'pxy':   await saveCNCFile(writable); break;
//     case 'json':  await saveProject(writable); break;
//     case 'svg':   await saveSvgFile(writable); break;
//     default:
//       console.warn('Unsupported file type for re-save.');
//   }

//   await writable.close();
//   console.log(`💾 Re-saved ${handle.name}`);
//   return handle;
// }


//
export async function saveCNC(fileHandle = null, data = ``) {

  try {
    // Si no se pasa fileHandle, pedimos uno al usuario
    if (!fileHandle) {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: `project.nc`,
        types: [
          {
            description: 'CNC file',
            accept: { 'text/plain': ['.pxy', '.nc'] },
          },
        ],
      });
    }

    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();

    console.log("💾 Proyecto guardado correctamente");
  } catch (err) {
    console.error("❌ Error al guardar el proyecto:", err);
  }
}






//Pasar el nombre de proyecto como sugerencia del  svg?
export async function saveSvg(fileHandle = null, data = ``) {

  try {
    // Si no se pasa fileHandle, pedimos uno al usuario
    if (!fileHandle) {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: `project.svg`,
        types: [
          {
            description: 'SVG file',
            accept: { 'image/svg+xml': ['.svg'] },
          },
        ],
      });
    }

    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();

    console.log("💾 Proyecto guardado correctamente");
  } catch (err) {
    console.error("❌ Error al guardar el proyecto:", err);
  }
}


export async function saveProject(fileHandle = null, data = ``) {

  try {
    // Si no se pasa fileHandle, pedimos uno al usuario
    if (!fileHandle) {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: `project.json`,
        types: [
          {
            description: "Proyecto CAD",
            accept: { "application/json": [".json"] },
          },
        ],
      });
    }

    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();

    console.log("💾 Proyecto guardado correctamente");
  } catch (err) {
    console.error("❌ Error al guardar el proyecto:", err);
  }
}


export async function loadProject(fileHandle = null, ) {
  try {
    if (!fileHandle) {
      [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Proyecto CAD",
            accept: {
              "application/json": [".json"],
              "text/plain"      : [".nc", ".pxy"],
              "image/svg+xml"   : [".svg"],
              "image/x-dxf"     : [".dxf"],
              "image/png"       : [".png"],
              "image/jpeg"      : [".jpg"]
            },
          },
        ],
        excludeAcceptAllOption: true,
      });
    }

    const file = await fileHandle.getFile();
    const text = await file.text();
    return({name: fileHandle.name, text:text});
  } catch (err) {
    console.error("❌ Error al cargar el proyecto:", err);
  }
}
