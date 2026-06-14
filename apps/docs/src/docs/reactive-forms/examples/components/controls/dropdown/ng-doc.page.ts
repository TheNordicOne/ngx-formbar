import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsControlsCategory from '../ng-doc.category';
import { DropdownExampleComponent } from './dropdown-example.component';

const DropdownPage: NgDocPage = {
  title: 'Dropdown',
  mdFile: './index.md',
  category: ReactiveFormsControlsCategory,
  order: 5,
  demos: { DropdownExampleComponent },
};

export default DropdownPage;
