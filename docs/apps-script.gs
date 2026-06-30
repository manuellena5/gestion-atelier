/**
 * INSTRUCCIONES:
 * 1. Ir a script.google.com → Nuevo proyecto
 * 2. Pegar este código reemplazando el contenido por defecto
 * 3. Cambiar SPREADSHEET_ID por el ID de tu Google Sheet
 *    (lo encontrás en la URL: https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit)
 * 4. Asegurate de que la hoja tenga 3 pestañas llamadas: "Clientes", "Pedidos", "Medidas"
 * 5. Clic en "Implementar" → "Nueva implementación"
 * 6. Tipo: "Aplicación web"
 * 7. Ejecutar como: "Yo"
 * 8. Acceso: "Cualquier persona"
 * 9. Copiar la URL generada y pegarla en Configuración de la app
 */

const SPREADSHEET_ID = 'PEGA_AQUI_EL_ID_DE_TU_SPREADSHEET';

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const data = payload.data;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    let result;
    switch (action) {
      case 'test':
        result = { success: true, message: 'Conexión OK' };
        break;
      case 'syncClientas':
        result = syncClientas(ss, data);
        break;
      case 'syncPedidos':
        result = syncPedidos(ss, data);
        break;
      case 'syncMedidas':
        result = syncMedidas(ss, data);
        break;
      default:
        result = { success: false, message: 'Acción desconocida: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

/**
 * Busca una fila por keyField y la actualiza, o inserta una nueva si no existe.
 */
function upsertRows(sheet, data, keyField) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const keyColIndex = headers.indexOf(keyField);
  if (keyColIndex === -1) {
    throw new Error('No se encontró la columna clave: ' + keyField);
  }

  const rowData = headers.map((header) => {
    const value = data[header];
    return value === undefined || value === null ? '' : value;
  });

  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][keyColIndex] === data[keyField]) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    sheet.appendRow(rowData);
  } else {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  }
}

function syncClientas(ss, data) {
  const headers = ['id', 'nombre', 'telefono', 'email', 'notas', 'fechaCreacion', 'updatedAt'];
  const sheet = getOrCreateSheet(ss, 'Clientes', headers);
  upsertRows(sheet, data, 'id');
  return { success: true, message: 'Clienta sincronizada' };
}

function syncPedidos(ss, data) {
  const headers = [
    'id',
    'clientaId',
    'descripcion',
    'fechaPedido',
    'fechaEntrega',
    'estado',
    'insumos',
    'horasDedicadas',
    'precioPorHora',
    'pctGanancia',
    'precioVenta',
    'sena',
    'cobros',
    'notas',
    'fechaCreacion',
    'updatedAt',
  ];
  const sheet = getOrCreateSheet(ss, 'Pedidos', headers);
  const row = Object.assign({}, data, {
    insumos: JSON.stringify(data.insumos || []),
    cobros: JSON.stringify(data.cobros || []),
  });
  upsertRows(sheet, row, 'id');
  return { success: true, message: 'Pedido sincronizado' };
}

function syncMedidas(ss, data) {
  const headers = ['id', 'clientaId', 'nombre', 'valor', 'unidad', 'esBasica', 'prenda', 'fecha'];
  const sheet = getOrCreateSheet(ss, 'Medidas', headers);
  upsertRows(sheet, data, 'id');
  return { success: true, message: 'Medida sincronizada' };
}
