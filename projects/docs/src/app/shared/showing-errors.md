{% macro withDirective(controlType, controlInstanceType) %}
Showing errors works pretty much the same as always. You get access to the form control and then access `hasError`.

In TypeScript set up a getter
```ts
// inject the instance of the directive
private readonly {{controlInstanceType | lower}} = inject(Ngxfw{{controlInstanceType}}Directive<{{controlType}}>);

// Get access to the underlying form {{controlInstanceType | lower}}
get form{{controlInstanceType}}() {
  return this.{{controlInstanceType | lower}}.form{{controlInstanceType}};
}
```

Then, in your template you can do something like this

```html
@if(form{{controlInstanceType}}?.hasError('required')) {
  <span>Required</span>
}
```
{% endmacro %}
