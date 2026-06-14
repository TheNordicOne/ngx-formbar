import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsBlocksCategory from '../ng-doc.category';
import { NoteExampleComponent } from './note-example.component';

const NotePage: NgDocPage = {
  title: 'Note',
  mdFile: './index.md',
  category: ReactiveFormsBlocksCategory,
  order: 1,
  demos: { NoteExampleComponent },
};

export default NotePage;
