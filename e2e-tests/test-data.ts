export const adminUser = {
  email: process.env.ADMIN_EMAIL || "admin@tantran.dev",
  password: process.env.ADMIN_PASSWORD || "tantran",
};

export const testUsers = {
  manager: {
    email: "manager.test@example.com",
    password: "password123",
    name: "Test Manager",
    role: "Quản lý", // Manager in Vietnamese
  },
  technician: {
    email: "technician.test@example.com",
    password: "password123",
    name: "Test Technician",
    role: "Kỹ thuật viên", // Technician in Vietnamese
  },
  reception: {
    email: "reception.test@example.com",
    password: "password123",
    name: "Test Reception",
    role: "Lễ tân", // Reception in Vietnamese
  },
};
