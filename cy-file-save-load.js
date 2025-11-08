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
              "image/x-dxf"     : [".dxf"]

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
