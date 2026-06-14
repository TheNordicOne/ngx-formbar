ngx-formbar generates forms from JSON or a plain object. You can hide, disable, and mark fields as readonly using expressions that evaluate against the form's current value.

The first focus is JSON compatibility. A form configuration is plain data, so anything that holds JSON can hold a form: a database column, a config file, an API response. No custom serialization is needed.

The second focus is staying close to Angular. The terminology mirrors Angular's, and the implementation builds on its form primitives and signals. You keep full control of the form and read values through the standard forms API.

ngx-formbar ships **no** pre-built components by design. You pick the UI library and the markup. Your components are still plain Angular and stay usable on their own. They implement a small interface contract and declare `input()` signals instead of extending a base class. The core logic stays encapsulated without locking you into a specific component shape.


## What Is the Motivation?

There are a few popular solutions that already give you "JSON forms", and they are fine for many cases. On the projects I worked on, though, they kept falling short. Paying for a commercial alternative was not on the table either.

The conditions we needed for showing and hiding fields were either out of reach with simple string expressions, or required so much nesting in the JSON-based alternatives that they were painful to author and read. Storing the whole form configuration in a database was a hard requirement, so its shape had to be plain data we could load and persist as JSON.

The other recurring pain was the components themselves. Most existing libraries pull in a separate UI-specific package for each design system, push you toward inheriting from a base class to write a custom component, and lock it to their own runtime. That makes it hard to align forms with a customer's design and impossible to drop one into a regular Angular form unchanged.

On the next project, a fully Angular application, the same needs came up. This time an editor for the configurations themselves was a hard requirement on top, and switching the stack was not an option. I checked the existing packages once more, found the same gaps, and built a small custom solution with just the pieces I needed. It still had its share of nesting, but it was shaped around what we actually needed and stayed easier to follow than the existing options. It worked well. After the project I took what I learned and built an improved version in a personal sandbox project, kept as a reference for myself. The idea of releasing it as a package came some time later. The package has evolved since then: it started with Angular's directive composition and now uses the interface contract. 
