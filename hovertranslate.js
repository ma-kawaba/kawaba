// On page load, change all the tlt spans to be formatted for reading
document.addEventListener("DOMContentLoaded", () => {
  let tlts = document.querySelectorAll("span.tlt");
  for (let i = 0; i < tlts.length; i++) {
    let input = tlts[i].innerHTML;
    let output = "";

    // Match all substrings enclosed in braces, preserving spaces
    let matches = input.match(/{[^}]*}|[^{}]+/g);

    if (matches) {
      matches.forEach((match) => {
        if (match.startsWith("{") && match.endsWith("}")) {
          // Handle word with translation
          let word = match.replace(/{|}/g, "");
          let wordt = word.split("|");
          output += "<span class='og'>";
          output += wordt[0]; // Original word
          output += "<span class='tl'>";
          output += wordt[1] || ""; // Translation
          output += "</span></span>";
        } else {
          // Handle plain text (spaces or non-brace content)
          output += match;
        }
      });
    }

    tlts[i].innerHTML = output; // Update the content

    // Get translateables and their corresponding translations within this `tlt`
    let translateables = tlts[i].querySelectorAll("span.og");
    let translations = tlts[i].querySelectorAll("span.tl");

    for (let j = 0; j < translateables.length; j++) {
      let og = translateables[j];
      let tl = translations[j];

      // Add mouse listener to each og that shows the tl
      og.addEventListener("mouseenter", () => {
        tl.style.display = "inherit";
        og.style.background = "rgba(0,0,0,0.2)";
      });

      og.addEventListener("click", () => {
        tl.style.display = "inherit";
        og.style.background = "rgba(0,0,0,0.2)";
      });

      // When the mouse leaves it, hide the tl
      window.addEventListener("click", (event) => {
        if (!og.contains(event.target)) {
          tl.style.display = "none";
          og.style.background = "";
        }
      });

      og.addEventListener("mouseleave", () => {
        tl.style.display = "none";
        og.style.background = "";
      });
    }
  }
});