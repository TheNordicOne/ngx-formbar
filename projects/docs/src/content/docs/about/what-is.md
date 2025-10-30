---
title: What is ngx-formbar?
keyword: WhatIsNgxFormbarPage
sidebar:
  order: 0
---

__ngx-formbar__ generates reactive forms from a JSON or a normal object. It supports dynamically hiding, disabling and marking as readonly with complex expressions.

The first key focus is on compatibility with JSON, so that the whole form configuration can actually be stored by any means that are compatible with JSON (either by directly saving "as is" or by serializing).

The second key focus is to be as close to Angular as possible. Not just the whole wording, but also in terms of technologies used. You still have full control over the form and use it pretty much like any other form. No additional API to know, just to access the forms value.

_ngx-formbar_ comes with **no** pre-built components by design. This gives you flexibility of what framework to use and how to structure the markup. Furthermore, it uses the [Directive Composition API](https://angular.dev/guide/directives/directive-composition-api) instead of inheritance. While this may seem to make some things a little more verbose, it is the better approach to encapsulate the core logic.


## What is the motivation?

There already are at least two popular solutions out there, that pretty much already provide you with "JSON forms". And I think overall they are fine. However. it has been more than enough times, where the requirements of the project made it practically impossible to use any of those. On one projects we needed much more complex conditions for showing and hiding, while also maintaining them in a database. This often was a hard requirement in projects I worked on.

Not even a year ago, when something like this came up again, and I once again checked if those packages maybe were a perfect fit this time. Unfortunately it was again not flexible enough. Though this time the application was already pretty much fully implemented in Angular, so we couldn't just switch to some other tech. Especially because we also needed a UI to configure a form. I ended up implementing a custom solution with only the bits and pieces actually needed and it worked well.

After the project finished I decided to take the basic idea and turn it into its own package. And here we are.
