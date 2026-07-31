import { useState, useEffect } from "react";

/**
 * Hook personalizado para gestionar el equipamiento del gimnasio
 * Maneja CRUD completo con persistencia en localStorage
 */
export const useEquipment = () => {
  const [equipment, setEquipment] = useState(() => {
    const stored = localStorage.getItem("crm_equipment");
    return stored ? JSON.parse(stored) : getInitialEquipment();
  });

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem("crm_equipment", JSON.stringify(equipment));
  }, [equipment]);

  const addEquipment = (newEquipment) => {
    const equipment = {
      id: Date.now(),
      ...newEquipment,
    };
    setEquipment((prev) => [...prev, equipment]);
    return equipment;
  };

  const updateEquipment = (id, updates) => {
    setEquipment((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const deleteEquipment = (id) => {
    setEquipment((prev) => prev.filter((item) => item.id !== id));
  };

  const getEquipmentStats = () => {
    const available = equipment.filter((e) => e.status === "Disponible").length;
    const maintenance = equipment.filter(
      (e) => e.status === "Mantenimiento",
    ).length;
    const total = equipment.length;

    return { available, maintenance, total };
  };

  return {
    equipment,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    getEquipmentStats,
  };
};

// Equipamiento inicial
function getInitialEquipment() {
  return [
    {
      id: 1,
      name: "Barra Olímpica",
      category: "Pesas Libres",
      status: "Disponible",
      quantity: 5,
      lastMaintenance: "2026-01-15",
    },
    {
      id: 2,
      name: "Mancuernas 5-50kg",
      category: "Pesas Libres",
      status: "Disponible",
      quantity: 10,
      lastMaintenance: "2026-02-01",
    },
    {
      id: 3,
      name: "Rack Sentadilla",
      category: "Máquinas",
      status: "Disponible",
      quantity: 2,
      lastMaintenance: "2026-01-20",
    },
    {
      id: 4,
      name: "Cinta de Correr",
      category: "Cardio",
      status: "Mantenimiento",
      quantity: 8,
      lastMaintenance: "2026-02-15",
    },
    {
      id: 5,
      name: "Bicicleta Estática",
      category: "Cardio",
      status: "Disponible",
      quantity: 10,
      lastMaintenance: "2026-02-10",
    },
    {
      id: 6,
      name: "Banco Plano",
      category: "Bancos",
      status: "Disponible",
      quantity: 6,
      lastMaintenance: "2026-01-25",
    },
    {
      id: 7,
      name: "Banco Inclinado",
      category: "Bancos",
      status: "Disponible",
      quantity: 4,
      lastMaintenance: "2026-01-25",
    },
    {
      id: 8,
      name: "Polea Alta/Baja",
      category: "Poleas",
      status: "Disponible",
      quantity: 3,
      lastMaintenance: "2026-02-05",
    },
    {
      id: 9,
      name: "Kettlebells",
      category: "Pesas Libres",
      status: "Disponible",
      quantity: 15,
      lastMaintenance: "2026-02-01",
    },
    {
      id: 10,
      name: "TRX",
      category: "Funcional",
      status: "Disponible",
      quantity: 6,
      lastMaintenance: "2026-01-30",
    },
  ];
}
