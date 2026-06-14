import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsControlsCategory from '../ng-doc.category';
import { FileExampleComponent } from './file-example.component';

const FilePage: NgDocPage = {
  title: 'File',
  mdFile: './index.md',
  category: ReactiveFormsControlsCategory,
  order: 8,
  demos: { FileExampleComponent },
};

export default FilePage;
