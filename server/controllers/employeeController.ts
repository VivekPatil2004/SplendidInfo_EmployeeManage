import { Request, Response } from 'express';
import { employeeService } from '../services/employeeService';
import { HTTP_STATUS } from '../utils/constants';

export class EmployeeController {
  async getAll(req: Request, res: Response) {
    const employees = await employeeService.getAllEmployees();
    res.json(employees);
  }

  async create(req: Request, res: Response) {
    const employee = await employeeService.createEmployee(req.body);
    res.status(HTTP_STATUS.CREATED).json(employee);
  }

  async update(req: Request, res: Response) {
    const employee = await employeeService.updateEmployee(Number(req.params.id), req.body);
    res.json(employee);
  }

  async delete(req: Request, res: Response) {
    await employeeService.deleteEmployee(Number(req.params.id));
    res.json({ message: 'Employee removed' });
  }
}

export const employeeController = new EmployeeController();
