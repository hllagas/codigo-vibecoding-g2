export const MOCK_KPI = {
  activeShipments: 47,
  deliveryRate: 84,
  delayedCount: 8,
  routesInProgress: 12,
  availableDrivers: 18,
  totalDrivers: 25,
  deliveredCount: 142,
  cancelledCount: 6,
  returnedCount: 2,
  totalFinished: 150,
};

export const MOCK_SHIPMENT_VOLUME_WEEKLY = [
  { period: '2025-W01', count: 32 },
  { period: '2025-W02', count: 41 },
  { period: '2025-W03', count: 28 },
  { period: '2025-W04', count: 55 },
  { period: '2025-W05', count: 49 },
  { period: '2025-W06', count: 63 },
  { period: '2025-W07', count: 38 },
  { period: '2025-W08', count: 72 },
];

export const MOCK_SHIPMENT_VOLUME_MONTHLY = [
  { period: '2024-10', count: 148 },
  { period: '2024-11', count: 172 },
  { period: '2024-12', count: 201 },
  { period: '2025-01', count: 185 },
  { period: '2025-02', count: 223 },
  { period: '2025-03', count: 197 },
];

export const MOCK_SHIPMENTS_BY_STATUS = [
  { name: 'Entregado',   value: 142, color: '#10b981' },
  { name: 'En tránsito', value: 47,  color: '#f59e0b' },
  { name: 'Procesando',  value: 23,  color: '#3b82f6' },
  { name: 'Pendiente',   value: 18,  color: '#71717a' },
  { name: 'Cancelado',   value: 6,   color: '#f87171' },
  { name: 'Devuelto',    value: 2,   color: '#fb923c' },
];

export const MOCK_DELIVERY_PERFORMANCE = [
  { period: '2024-10', onTime: 38, delayed: 8  },
  { period: '2024-11', onTime: 45, delayed: 6  },
  { period: '2024-12', onTime: 52, delayed: 10 },
  { period: '2025-01', onTime: 48, delayed: 7  },
  { period: '2025-02', onTime: 61, delayed: 9  },
  { period: '2025-03', onTime: 54, delayed: 5  },
];

export const MOCK_TOP_CITIES = [
  { name: 'Lima',            value: 87 },
  { name: 'Bogotá',          value: 64 },
  { name: 'Ciudad de México', value: 58 },
  { name: 'Buenos Aires',    value: 52 },
  { name: 'Santiago',        value: 43 },
  { name: 'Medellín',        value: 38 },
  { name: 'Guadalajara',     value: 31 },
  { name: 'Caracas',         value: 27 },
  { name: 'Quito',           value: 24 },
  { name: 'Montevideo',      value: 19 },
];

export const MOCK_REVENUE_BY_CATEGORY = [
  { name: 'Electrónica',  value: 48500 },
  { name: 'Ropa',         value: 31200 },
  { name: 'Alimentos',    value: 28700 },
  { name: 'Muebles',      value: 22300 },
  { name: 'Libros',       value: 15800 },
  { name: 'Herramientas', value: 12400 },
];

export const MOCK_WAREHOUSE_UTILIZATION = [
  { name: 'Lima Norte', stock: 1240, capacity: 2000 },
  { name: 'Lima Sur',   stock: 1820, capacity: 2500 },
  { name: 'Bogotá',     stock: 980,  capacity: 1500 },
  { name: 'CDMX',       stock: 2100, capacity: 3000 },
  { name: 'Santiago',   stock: 760,  capacity: 1200 },
];

export const MOCK_FLEET_AREA = [
  { period: '2024-10', activas: 12, mantenimiento: 3, inactivas: 2 },
  { period: '2024-11', activas: 14, mantenimiento: 2, inactivas: 2 },
  { period: '2024-12', activas: 16, mantenimiento: 4, inactivas: 1 },
  { period: '2025-01', activas: 15, mantenimiento: 2, inactivas: 3 },
  { period: '2025-02', activas: 18, mantenimiento: 3, inactivas: 1 },
  { period: '2025-03', activas: 19, mantenimiento: 2, inactivas: 1 },
];

export const MOCK_FLEET_BY_TYPE = [
  { name: 'Camión',      value: 12 },
  { name: 'Furgoneta',   value: 8  },
  { name: 'Motocicleta', value: 5  },
  { name: 'Bicicleta',   value: 3  },
];

export const MOCK_DRIVER_AVAILABILITY = [
  { name: 'Disponible',    value: 18 },
  { name: 'No disponible', value: 7  },
];

export const MOCK_CUSTOMER_TYPE = [
  { name: 'Empresa',    value: 68 },
  { name: 'Individual', value: 42 },
];

export const MOCK_CUSTOMER_GROWTH = [
  { period: '2024-07', count: 45  },
  { period: '2024-08', count: 58  },
  { period: '2024-09', count: 71  },
  { period: '2024-10', count: 89  },
  { period: '2024-11', count: 98  },
  { period: '2024-12', count: 110 },
  { period: '2025-01', count: 125 },
  { period: '2025-02', count: 142 },
  { period: '2025-03', count: 163 },
];

export const MOCK_TOP_CUSTOMERS = [
  { name: 'TechCorp SA',       value: 34 },
  { name: 'GlobalTrade Ltd',   value: 28 },
  { name: 'FastShip Co',       value: 22 },
  { name: 'Mercado Central',   value: 19 },
  { name: 'LogiParts SRL',     value: 16 },
  { name: 'AutoParts Inc',     value: 14 },
  { name: 'FoodDist SA',       value: 12 },
  { name: 'MedSupply Co',      value: 10 },
  { name: 'HomeGoods Ltd',     value: 9  },
  { name: 'SportGear SA',      value: 7  },
];

export const MOCK_TRIPS_PER_TRANSPORT = [
  { transport: 'Camión-01',  completadas: 24, en_progreso: 3, planificadas: 5 },
  { transport: 'Camión-02',  completadas: 18, en_progreso: 2, planificadas: 7 },
  { transport: 'Furgón-01',  completadas: 31, en_progreso: 4, planificadas: 3 },
  { transport: 'Furgón-02',  completadas: 22, en_progreso: 1, planificadas: 6 },
  { transport: 'Moto-01',    completadas: 45, en_progreso: 6, planificadas: 8 },
  { transport: 'Moto-02',    completadas: 38, en_progreso: 5, planificadas: 4 },
  { transport: 'Bici-01',    completadas: 29, en_progreso: 2, planificadas: 5 },
];

export const MOCK_TOP_PRODUCTS = [
  { name: 'Laptop Pro X1',       value: 145 },
  { name: 'Smartphone Galaxy',   value: 132 },
  { name: 'Tablet Air',          value: 98  },
  { name: 'Auriculares BT',      value: 87  },
  { name: 'Monitor 27"',         value: 76  },
  { name: 'Teclado Mecánico',    value: 65  },
  { name: 'Mouse Inalámbrico',   value: 58  },
  { name: 'Cámara Web HD',       value: 52  },
  { name: 'Disco SSD 1TB',       value: 48  },
  { name: 'Hub USB-C',           value: 43  },
];
