import Employee from '../models/Employee';

export class EmployeeRepository {
  async findAll() {
    return Employee.find({});
  }

  async create(data: Record<string, any>) {
    return Employee.create(data);
  }

  async updateById(id: number, data: Record<string, any>) {
    return Employee.findOneAndUpdate({ id }, data, { new: true, runValidators: true });
  }

  async deleteById(id: number) {
    return Employee.findOneAndDelete({ id });
  }
}

export const employeeRepository = new EmployeeRepository();
