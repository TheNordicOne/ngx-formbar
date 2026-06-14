import { NgDocPage } from '@ng-doc/core';
import ReactiveFormsGroupsCategory from '../ng-doc.category';
import { GroupExampleComponent } from './group-example.component';

const GroupPage: NgDocPage = {
  title: 'Group',
  mdFile: './index.md',
  category: ReactiveFormsGroupsCategory,
  order: 1,
  demos: { GroupExampleComponent },
};

export default GroupPage;
