---
title: What is ngx-formwork?
keyword: WhatIsNgxFormworkPage
---

__ngx-formwork__ generates reactive forms from a JSON or a normal object. It supports dynamically hiding, disabling and marking as readonly with complex expressions.

The first key focus is on compatibility with JSON, so that the whole form configuration can actually be stored by any means that are compatible with JSON (either by directly saving "as is" or by serializing).

The second key focus is to be as close to Angular as possible. Not just the whole wording, but also in terms of technologies used. YOu still have full control over the form and use it pretty much like any other form. No additional API to know, just to access the forms value.

## What is the motivation?

There already are at least two popular solutions out there, that pretty much already provide you with "JSON forms". And I think overall they are fine. However. it has been more than enough times, where the requirements of the project made it practically impossible to use any of those. On one projects we needed much more complex conditions for showing and hiding, while also maintaining them in a database. This often was a hard requirement in projects I worked on.

Not even a year ago, when something like this came up again, and I once again checked if those packages maybe were a perfect fit this time. Unfortunately it was again not flexible enough. Though this time the application was already pretty much fully implemented in Angular, so we couldn't just switch to some other tech. Especially because we also needed a UI to configure a form. I ended up implementing a custom soultion with only the bits and pieces actually needed and it worked well.

After the project finished I decided to take the basic idea and turn it into its own package. And here we are.

## What are the key differences compared to other solutions?

- Full JSON compatibility (everything can be defined with primitives)
- Create your own controls, instead of relying on other packages to render your controls
- Full control and access of the form itself
- Decent type safety when writing a form in TS
- Implemented with almost only Angular features
- Expression syntax is essentially JS, only evaluated against the forms value
- Generating a test id for each control

The two most important features are the JSON compatibility and the fact that you have full control over a controls template and additional behaviors. You can make a control as specialized and as generic as you want.


## Who is this for?

This is for everyone that needs a whole lot of flexibility and control when working with dynamic forms. This is by no means supposed to be a replacement for other solutions and it likely is not a good fit for every projects (or developer).

Setting things up is (probably) about as complex as with other solutions, but of course it requires a little more work to create the components that can actually be used with __ngx-formwork__.
