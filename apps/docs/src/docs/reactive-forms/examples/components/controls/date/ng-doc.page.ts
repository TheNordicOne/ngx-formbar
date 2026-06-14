import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsControlsCategory from '../ng-doc.category';
import { DateExampleComponent } from './date-example.component';

const DatePage: NgDocPage = {
  title: 'Date',
  mdFile: './index.md',
  category: ReactiveFormsControlsCategory,
  order: 7,
  demos: { DateExampleComponent },
};

export default DatePage;
