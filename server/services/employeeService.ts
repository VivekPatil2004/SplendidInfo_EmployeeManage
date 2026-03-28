import { employeeRepository } from '../repositories/employeeRepository';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';

export class EmployeeService {
  async getAllEmployees() {
    return employeeRepository.findAll();
  }

  async createEmployee(data: any) {
    return employeeRepository.create(data);
  }

  async updateEmployee(id: number, data: any) {
    const employee = await employeeRepository.updateById(id, data);
    if (!employee) throw new AppError('Employee not found', HTTP_STATUS.NOT_FOUND);
    return employee;
  }

  async deleteEmployee(id: number) {
    const employee = await employeeRepository.deleteById(id);
    if (!employee) throw new AppError('Employee not found', HTTP_STATUS.NOT_FOUND);
    return;
  }
}

export const employeeService = new EmployeeService();
