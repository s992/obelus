import { Cell } from './Cell';
import { Column } from './Column';
import { Row } from './Row';
import { Table as BaseTable } from './Table';
import { TableBody } from './TableBody';
import { TableHeader } from './TableHeader';

export const Table = Object.assign(BaseTable, {
  Cell,
  Column,
  Row,
  Body: TableBody,
  Header: TableHeader,
});
