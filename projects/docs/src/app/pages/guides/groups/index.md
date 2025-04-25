---
keyword: GroupsPage
---
{% import "../../../shared/showing-errors.md" as showingErrors %}

A group is used to group controls together. It results in an Angular `FormGroup` instance.

Most of the time you will only need one or two different group types. Where they really are handy though, is if you need different behaviors. For example one that does not do anything special visually and one that is collapsible.


## Minimal Setup
> **Note**
> Checkout `*HelperPage` to see how to set up helpers.

{% include "../../../shared/group-setup.md" %}

## Configuration

Checkout `*ConfigurationPage` for how to configure a group.

## Hidden

{% include "../../../shared/hidden-explanation.md" %}

```ts name="group.component.ts"  group="group-visibility"
@Component({
  // ...
})
export class GroupComponent {
  private readonly control = inject(NgxfwGroupDirective<Group>);
  // Really only should ever be a boolean return value, but an expression could also return a number, string or object
  readonly isHidden: Signal<unknown> = this.control.isHidden; 
  
  constructor() {
    // Let formwork know, that you take care of handling visibility
    this.control.setVisibilityHandling('manual')
  }
}
```

```html name="group.component.html" group="group-visibility"
{% raw %}@if(isHidden()){
  <span>Some placeholder you want to use</span>
}
@if(!isHidden()){
  <div [formGroupName]="id">
    @for (control of controls(); track control.id) {
      <ng-template *ngxfwNgxfwAbstractControl="control" />
    }
  </div>
}{% endraw %}
```

### Hide Strategy

{% include "../../../shared/hide-strategy-explanation.md" %}


### Value Strategy

{% include "../../../shared/value-strategy-explanation.md" %}

## Disabled

{% include "../../../shared/disabled-explanation.md" %}

```ts name="group.component.ts"  group="group-disabled"
@Component({
  // ...
})
export class GroupComponent {
  private readonly control = inject(NgxfwGroupDirective<Group>);
  readonly disabled: Signal<boolean> = this.control.disabled;
}
```

```html name="group.component.html" group="group-disabled"
{% raw %}<div [formGroupName]="id">
  @for (control of controls(); track control.id) {
    <ng-template *ngxfwNgxfwAbstractControl="control" />
  }
</div>
<!-- Only show hint when group is disabled -->
@if(disabled()){
  <span>This is no longer relevant</span>
}{% endraw %}
```

## Readonly

{% include "../../../shared/readonly-explanation.md" %}

```ts name="group.component.ts"  group="group-readonly"
@Component({
  // ...
})
export class GroupComponent {
  private readonly control = inject(NgxfwGroupDirective<Group>);
  readonly readonly: Signal<boolean> = this.control.readonly;
}
```

```html name="group.component.html" group="group-readonly"
{% raw %}<div [formGroupName]="id">
  @for (control of controls(); track control.id) {
    <ng-template *ngxfwNgxfwAbstractControl="control" />
  }
</div>
@if(readonly()){
  <span>This cannot be edited</span>
}{% endraw %}
```

## Test ID

{% include "../../../shared/test-id.md" %}

```ts name="group.component.ts"  group="group-testid"
@Component({
  // ...
})
export class GroupComponent {
  private readonly control = inject(NgxfwGroupDirective<Group>);
  readonly testId: Signal<string> = this.control.testId;
}
```

```html name="group.component.html" group="group-testid"
{% raw %}<div [formGroupName]="id"  [attr.data-testId]="testId() + '-wrapper'">
  @for (control of controls(); track control.id) {
    <ng-template *ngxfwNgxfwAbstractControl="control" />
  }
</div>{% endraw %}
```

## Showing Errors
{{ showingErrors.withDirective("Group", "Group") }} 
 
