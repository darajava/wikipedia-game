import axios from "axios";
import express from "express";
// import { isUser, MyRequest } from "../utils/jwt";
import iconv from "iconv-lite";
import wretch from "wretch";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Ok!");
});

// function to remove all text between balanced parentheses
function removeParentheses(text: string) {
  // replace all instanced of {{ with G
  text = text.replace(/\{\{/g, "⦑");

  // replace all instanced of }} with H
  text = text.replace(/\}\}/g, "⦒");

  do {
    const newText = text.replace(/⦑([^⦑⦒]*)⦒/g, "");
    if (newText === text) {
      break;
    }
    text = newText;
  } while (true);

  return text;
}

// replace links with the text of the link
function replaceLinks(text: string) {
  // capture text between [[ and ]]

  // replace all instanced of [[ with A
  text = text.replace(/\[\[/g, "⦑");

  // replace all instanced of ]] with B
  text = text.replace(/\]\]/g, "⦒");

  do {
    const newText = text.replace(/⦑([^⦑⦒]*)⦒/g, (match, p1) => {
      const [link, text] = p1.split("|");
      if (p1.split("|").length > 2) {
        return "";
      }
      return text || link;
    });
    if (newText === text) {
      break;
    }
    text = newText;
  } while (true);

  //   let depth = 0;
  //   let result = "";
  //   let link = "";
  //   for (let i = 0; i < text.length; i++) {
  //     if (text[i] === "᎕") {
  //       depth++;
  //     } else if (text[i] === "᎑") {
  //       depth--;
  //       if (depth === 0) {
  //         // replace link with text of link
  //         if (link.includes("|")) {
  //           const split = link.split("|");
  //           result += split[1].trim().replace(/᎕/g, "").replace(/᎑/g, "");
  //         } else {
  //           result += link.trim().replace(/᎕/g, "").replace(/᎑/g, "");
  //         }
  //         link = "";
  //       }
  //     } else if (depth === 0) {
  //       result += text[i];
  //     } else if (depth > 1) {
  //       link += text[i];
  //     }
  //   }

  return text;
}

// replace links with the text of the link
function returnLinks(text: string) {
  // capture text between [[ and ]]

  const links = [];
  const regex = /\[\[(.*?)\]\]/g;
  const matches = text.match(regex);

  if (matches) {
    for (const match of matches) {
      // remove [[ and ]]
      const link = match.slice(2, -2);
      // replace link with text of link

      if (link.includes(":")) {
        continue;
      }
      if (link.includes("|")) {
        const split = link.split("|");
        links.push(split[0].trim());
      } else if (link.includes("#")) {
        const split = link.split("#");
        links.push(split[0].trim());
      } else {
        links.push(link.trim());
      }
    }
  }

  return links;
}

function returnBold(text: string) {
  // replace ''''' with '''
  text = text.replace(/'''''/g, "'''");
  // capture text between ''' and '''
  const regex = /'''(.*?)'''/g;
  const matches = text.match(regex);

  const answers = [];

  if (matches) {
    for (const match of matches) {
      // remove ''' and '''
      const bold = match.slice(3, -3);
      // replace bold with underscores

      answers.push(bold);
    }
  }

  return answers;
}

// remove titles
function removeTitles(text: string) {
  // capture text between == and ==
  const regex = /==(.*?)==/g;
  const matches = text.match(regex);

  if (matches) {
    for (const match of matches) {
      // remove == and ==
      const title = match.slice(2, -2);
      // replace title with nothing
      text = text.replace(match, "");
    }
  }

  return text;
}

// replace answers with the text of the answer
function replaceAnswers(text: string, answers: string[]) {
  // sort answers by length
  answers.sort((a, b) => b.length - a.length);

  // for each answer
  for (const answer of answers) {
    // replace match in text with answer wrapped in bold (case insensitive)
    // text = text.replace(new RegExp(answer, "gi"), `'''${answer}'''`);

    // capture match
    const regex = new RegExp(answer, "gi");
    const regex1 = new RegExp(".?.?.?" + answer + ".?.?.?", "gi");
    const matches = text.match(regex);
    const matches1 = text.match(regex1);

    // replace match with answer wrapped in bold
    if (matches) {
      for (let i = 0; i < matches.length; i++) {
        // if match is wrapped in ''' and ''' then don't replace
        // if (matches1[i].startsWith("'''") || matches1[i].endsWith("'''")) {
        //   continue;
        // }

        // find index of matches[i] in text
        const index = text.indexOf(matches[i]);

        // count number of ''' before index
        const count = (text.slice(0, index).match(/'''/g) || []).length;

        // if count is even then don't replace
        if (count % 2 === 1) {
          continue;
        }

        text = text.replace(matches[i], `'''${matches[i]}'''`);
      }
    }

    // text = text.replace(answer, `'''${answer}'''`);
  }

  return text;
}

// remove all italics
function removeItalics(text: string) {
  // capture text between '' and ''
  return text.replace(/[^']''[^']/g, "");
}

// get redirects
function getRedirects(text: string) {
  const redirects = [];

  // capture text between {{Redirect| and }}
  const regex = /\{\{Redirect\|(.*?)\}\}/gi;
  const matches = text.match(regex);

  if (matches) {
    for (const match of matches) {
      // remove {{Redirect| and }}
      const redirect = match.slice(11, -2).split("|")[0];
      redirects.push(redirect);
    }
  }

  // capture text between {{Redirect-multi| and }}
  const regex1 = /\{\{Redirect-multi\|(.*?)\}\}/gi;
  const matches1 = text.match(regex1);

  if (matches1) {
    for (const match of matches1) {
      // remove {{Redirect| and }}

      const params = match
        .replace("{{Redirect-multi|", "")
        .replace("}}", "")
        .split("|");

      const amount = parseInt(params[0], 10);

      redirects.push(...params.slice(1, amount + 1));
    }
  }

  return redirects;
}

// function to uniq an array case insensitive
function uniqCaseInsensitive(array: string[]) {
  const seen = new Set();
  return array.filter((item) => {
    const lower = item.toLowerCase();
    if (seen.has(lower)) {
      return false;
    } else {
      seen.add(lower);
      return true;
    }
  });
}

router.get("/article-info/:name", async (req, res) => {
  // get contents of a wikipedia article
  wretch(
    `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=revisions&rvprop=content&titles=${req.params.name}&redirects=`
    // { responseType: "arraybuffer" }
  )
    .get()
    .json((json) => {
      const page: any = Object.values(json.query.pages)[0];
      const content = page.revisions[0]["*"];

      const answers = getRedirects(content);

      // remove all text between {{ }}
      const contentWithoutTemplates = removeParentheses(content);

      // remove all ''''' and replace with '''
      const contentWithoutBoldItalic = contentWithoutTemplates.replace(
        /'''''/g,
        "'''"
      );

      // remove all text between ( )
      const regex2 = /\(.*?\)/g;
      const contentWithoutParentheses = contentWithoutBoldItalic.replace(
        regex2,
        ""
      );

      // remove all text between <!-- -->
      const regex3 = /<!--.*?-->/g;
      const contentWithoutComments = contentWithoutParentheses.replace(
        regex3,
        ""
      );

      // remove all newlines
      const contentWithoutNewlines = contentWithoutComments.replace(/\n/g, "");

      // remove all text between ref and /ref
      const regex4 = /<ref.*?\/ref>/g;
      const contentWithoutRefs = contentWithoutNewlines.replace(regex4, "");

      // remove all text between math and /math
      const regex4_1 = /<ref.*?\/ref>/g;
      const contentWithoutMaths = contentWithoutNewlines.replace(regex4_1, "");

      // remove titles
      const contentWithoutTitles = removeTitles(contentWithoutMaths);

      // remove links
      const contentWithoutLinks = replaceLinks(contentWithoutTitles);

      // get first sentence
      const regex5 = / ?[^.!?]+[.!?]+ ?/g;
      const sentences = contentWithoutLinks.match(regex5);

      answers.push(...returnBold(sentences[0]));

      // get page title
      const title = page.title;
      if (!answers.includes(title.toLowerCase())) {
        answers.push(title);
      }

      // get page link
      const link = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;

      res.send({
        answers: uniqCaseInsensitive(answers),
        links: returnLinks(contentWithoutRefs).slice(0, 20),
        questions: sentences
          //   .map(replaceBold)
          //   .filter(filterBad)
          .map((e) => e.replace(/  /g, " "))
          .map((e) => e.replace(/ \./g, "."))
          .map((e) => replaceAnswers(e, answers))
          .slice(0, 5),
        content,
        link,
      });
    });
});

export default router;
