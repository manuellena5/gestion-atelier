/**
 * INSTRUCCIONES:
 * 1. Ir a script.google.com → Nuevo proyecto
 * 2. Pegar este código reemplazando el contenido por defecto
 *    (SPREADSHEET_ID ya está configurado con la planilla del atelier;
 *    si usás esto para otra planilla, reemplazalo por el ID de la tuya,
 *    que se encuentra en la URL: https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit)
 * 3. Asegurate de que la hoja tenga 3 pestañas llamadas: "Clientes", "Pedidos", "Medidas"
 * 4. Clic en "Implementar" → "Nueva implementación"
 * 5. Tipo: "Aplicación web"
 * 6. Ejecutar como: "Yo"
 * 7. Acceso: "Cualquier persona"
 * 8. Copiar la URL generada y pegarla en Configuración de la app
 *
 * Si ya tenías este script desplegado y lo estás actualizando (por ejemplo,
 * para sumar la acción "fetchAll" que trae los datos guardados):
 * pegá el código nuevo reemplazando el anterior y volvé a "Implementar" →
 * "Gestionar implementaciones" → ícono de lápiz en la implementación activa →
 * Versión "Nueva versión" → Implementar. La URL no cambia, no hace falta
 * actualizarla en la app.
 */

const SPREADSHEET_ID = '1r6tc1gSIBjzMmPogCkFrlt4U7e6c_HuBrJlmO0jtDpU';

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
      case 'fetchAll':
        result = fetchAll(ss);
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

/**
 * Devuelve todas las filas de una hoja como objetos { header: valor }.
 * Ignora filas sin "id".
 */
function getAllRows(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = {};
    headers.forEach(function (header, idx) {
      row[header] = values[i][idx];
    });
    if (row.id) rows.push(row);
  }
  return rows;
}

function parsePedidoRow(row) {
  try {
    row.insumos = row.insumos ? JSON.parse(row.insumos) : [];
  } catch (e) {
    row.insumos = [];
  }
  try {
    row.cobros = row.cobros ? JSON.parse(row.cobros) : [];
  } catch (e) {
    row.cobros = [];
  }
  return row;
}

/**
 * Trae todos los datos guardados en la planilla, para que la app
 * los pueda importar al dispositivo (botón "Sincronizar ahora").
 */
function fetchAll(ss) {
  return {
    success: true,
    clientas: getAllRows(ss, 'Clientes'),
    medidas: getAllRows(ss, 'Medidas'),
    pedidos: getAllRows(ss, 'Pedidos').map(parsePedidoRow),
  };
}
