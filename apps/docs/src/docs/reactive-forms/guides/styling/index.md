Since you write the form components yourself, the markup and styles are entirely yours. The library only adds a thin structural layer to mount your components. This guide explains the DOM that layer produces and where to put layout so it reaches your components.

## DOM structure

`<ngxfb-form>` sits inside your form element and mounts your configuration, giving a tree like this:
 
```html
<form [formGroup]="form">    <!-- your form element --> 
  <ngxfb-form>               <!-- mounts your configuration -->
    <ngxfb-control-outlet>   <!-- transparent: display: contents -->
      <app-text-control>     <!-- your component, a layout item -->
      <app-group>            <!-- your component, a layout item -->
```

The outlets, `<ngxfb-control-outlet />` and `<ngxfb-form-array-outlet />`, are `display: contents`, so they generate no box. Your components therefore participate directly in the layout of `<ngxfb-form>`, with nothing of the library's in between.

> **Note**
> The outlets are not styling hooks. Treat them as absent.

## Laying out your components

A layout set on `<ngxfb-form>` arranges your components. This live demo shows you how the `<ngxfb-control-outlet>` is ignored for styling.

Switch between the layouts below to see different examples.

<docs-component-example>

{{ NgDocActions.demo("StylingLayoutExampleComponent", { container: false }) }}

</docs-component-example>

