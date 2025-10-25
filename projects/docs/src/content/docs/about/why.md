---
title: Why ngx-formwork?
keyword: WhyNgxFormworkPage
sidebar:
  order: 1
---

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
