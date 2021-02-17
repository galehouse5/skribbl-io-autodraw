export default function (element, onEnter, onLeave, onDrop) {
   let debouncer = 0;

   element.addEventListener("dragenter", function (event) {
      if (debouncer === 0) { onEnter(event); }
      debouncer++;
   });

   element.addEventListener("dragleave", function (event) {
      debouncer--;
      if (debouncer === 0) { onLeave(event); }
   });

   element.addEventListener("drop", function (event) {
      debouncer = 0;
      onDrop(event);
   });

   // MDN: If you want to allow a drop, you must prevent the default handling by cancelling the event. 
   element.addEventListener("dragover", function (event) {
      event.preventDefault();
   });
};
