import { Cell, Column, Row, TableBody, TableHeader } from './components';
import { Table as BaseTable } from './Table';

export const Table = Object.assign(BaseTable, {
  Cell,
  Column,
  Row,
  Body: TableBody,
  Header: TableHeader,
});
