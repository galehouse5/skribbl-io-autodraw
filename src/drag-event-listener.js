const interval = 100;

export default function (element, onEnter, onLeave) {
   let timeout = null;

   element.addEventListener("dragover", function (event) {
      // MDN: If you want to allow a drop, you must prevent the default handling by cancelling the event. 
      event.preventDefault();

      if (timeout === null) {
         onEnter(event);
      } else {
         window.clearTimeout(timeout);
      }

      timeout = window.setTimeout(function () {
         onLeave(event);
         timeout = null;
      }, interval);
   });
};
