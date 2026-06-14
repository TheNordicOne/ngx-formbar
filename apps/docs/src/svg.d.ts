// SVG files are loaded as raw text (see the build `loader` option in project.json),
// so importing one yields its markup as a string for inlining into the DOM.
declare module '*.svg' {
  const content: string;
  export default content;
}
