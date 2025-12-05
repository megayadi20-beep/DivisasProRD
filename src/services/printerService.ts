interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: {
    connect: () => Promise<any>;
    connected: boolean;
    disconnect: () => void;
  };
  addEventListener: (type: string, listener: (event: any) => void) => void;
  removeEventListener: (type: string, listener: (event: any) => void) => void;
}

// Variables locales para mantener la conexión viva en memoria
let activeDevice: BluetoothDevice | null = null;
let activeCharacteristic: any | null = null;
let onDisconnectCallback: (() => void) | null = null;

export const PrinterService = {
  commands: {
    INIT: '\x1B\x40',
    TEXT_CENTER: '\x1B\x61\x01',
    TEXT_LEFT: '\x1B\x61\x00',
    BOLD_ON: '\x1B\x45\x01',
    BOLD_OFF: '\x1B\x45\x00',
    LF: '\x0A', 
  },

  isSupported: () => {
    return (navigator as any).bluetooth !== undefined;
  },

  // Registrar un callback para cuando el dispositivo se desconecte (físicamente o por el OS)
  setDisconnectListener: (callback: () => void) => {
      onDisconnectCallback = callback;
  },

  getActiveConnection: () => {
      return {
          device: activeDevice,
          characteristic: activeCharacteristic,
          isConnected: activeDevice?.gatt?.connected || false
      };
  },

  scanAndConnect: async (): Promise<{ device: BluetoothDevice, server: any, characteristic: any } | null> => {
    try {
      console.log('Iniciando escaneo universal...');
      
      const commonPrinterUUIDs = [
          '000018f0-0000-1000-8000-00805f9b34fb', 
          '0000ffe0-0000-1000-8000-00805f9b34fb', 
          '0000ae30-0000-1000-8000-00805f9b34fb', 
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', 
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', 
          '0000af30-0000-1000-8000-00805f9b34fb', 
          '0000ff00-0000-1000-8000-00805f9b34fb'  
      ];

      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
            { services: commonPrinterUUIDs } 
        ],
        optionalServices: commonPrinterUUIDs, 
        acceptAllDevices: false 
      }).catch(async () => {
          return await (navigator as any).bluetooth.requestDevice({
              acceptAllDevices: true,
              optionalServices: commonPrinterUUIDs
          });
      });

      if (!device || !device.gatt) return null;

      // --- DISCONNECT HANDLER ---
      const handleDisconnect = () => {
          console.log('Dispositivo Bluetooth desconectado');
          activeDevice = null;
          activeCharacteristic = null;
          if (onDisconnectCallback) onDisconnectCallback();
      };
      device.addEventListener('gattserverdisconnected', handleDisconnect);

      console.log('Conectando GATT...');
      const server = await device.gatt.connect();
      
      // --- DISCOVERY PHASE ---
      const services = await server.getPrimaryServices();
      let writeCharacteristic = null;

      for (const service of services) {
          try {
              const characteristics = await service.getCharacteristics();
              for (const char of characteristics) {
                  if (char.properties.write || char.properties.writeWithoutResponse) {
                      writeCharacteristic = char;
                      break;
                  }
              }
          } catch (e) {
              console.warn(`Error leyendo servicio ${service.uuid}`, e);
          }
          if (writeCharacteristic) break;
      }

      if (!writeCharacteristic) {
          throw new Error("Impresora no compatible (Sin canal de escritura).");
      }

      // Guardar en memoria global
      activeDevice = device;
      activeCharacteristic = writeCharacteristic;

      return { device, server, characteristic: writeCharacteristic };

    } catch (error) {
      console.error('Error Bluetooth:', error);
      throw error;
    }
  },

  disconnect: () => {
      if (activeDevice && activeDevice.gatt?.connected) {
          activeDevice.gatt.disconnect();
      }
      activeDevice = null;
      activeCharacteristic = null;
  },

  printText: async (characteristic: any, text: string) => {
    // Si pasamos characteristic null, intentar usar la guardada en memoria
    const charToUse = characteristic || activeCharacteristic;

    if (!charToUse) throw new Error("No hay impresora conectada.");
    
    // Verificación de seguridad de conexión
    if (activeDevice && !activeDevice.gatt?.connected) {
        throw new Error("La impresora se desconectó. Por favor reconecte en Ajustes.");
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const CHUNK_SIZE = 50; 
    
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        try {
            await charToUse.writeValue(chunk);
            await new Promise(r => setTimeout(r, 20)); 
        } catch (e) {
             if (charToUse.properties.writeWithoutResponse) {
                 await charToUse.writeValueWithoutResponse(chunk);
             } else {
                 throw e;
             }
        }
    }
  },

  printTestReceipt: async (characteristic: any) => {
      const C = PrinterService.commands;
      const text = 
        C.INIT +
        C.TEXT_CENTER + 
        C.BOLD_ON + "PRUEBA DE CONEXION" + C.LF + C.BOLD_OFF +
        "--------------------------------" + C.LF +
        C.TEXT_LEFT +
        "Conexion estable." + C.LF +
        "Listo para imprimir." + C.LF +
        "--------------------------------" + C.LF +
        C.LF + C.LF + C.LF;
      
      await PrinterService.printText(characteristic, text);
  }
};