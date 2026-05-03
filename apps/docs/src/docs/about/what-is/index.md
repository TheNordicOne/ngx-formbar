**ngx-formbar** generates reactive forms from a JSON or a normal object. It supports dynamically hiding, disabling and marking as readonly with complex expressions.

The first key focus is on compatibility with JSON, so that the whole form configuration can actually be stored by any means that are compatible with JSON (either by directly saving "as is" or by serializing).

The second key focus is to be as close to Angular as possible. Not just the whole wording, but also in terms of technologies used. You still have full control over the form and use it pretty much like any other form. No additional API to know, just to access the forms value.

_ngx-formbar_ comes with **no** pre-built components by design. This gives you flexibility of what UI library to use and how to structure the markup. Your components stay plain Angular components and therefore are still usable on their own. They implement a small interface contract and declare `input()` signals instead of inheriting from a base class. This keeps the core logic encapsulated without locking you into a specific component shape.


## What is the motivation?

There already are at least two popular solutions out there that pretty much already provide you with "JSON forms", and overall they are fine. However, project requirements have often made it practically impossible to use any of those. On one project we needed much more complex conditions for showing and hiding. We also needed to maintain those conditions in a database, which often was a hard requirement in projects I worked on.

Not even a year ago something like this came up again. I once again checked if those packages were a perfect fit this time. Unfortunately they were not flexible enough. The application was already fully implemented in Angular, so we couldn't switch to other tech. We also needed a UI to configure a form. I ended up implementing a custom solution with only the bits and pieces actually needed, and it worked well.

After the project finished I decided to take the basic idea and turn it into its own package. And here we are.
