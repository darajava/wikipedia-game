import axios from "axios";
import express from "express";
// import { isUser, MyRequest } from "../utils/jwt";
import iconv from "iconv-lite";
import wretch from "wretch";
import { AppDataSource } from "../data-source";
import { Question } from "../entity/Question";
import fetch from "node-fetch";

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
    const matches = text.match(regex);

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

        text = text.replace(matches[i], `'''${i + "-" + i + "-" + i}'''`);
      }
      for (let i = 0; i < matches.length; i++) {
        text = text.replace(
          `'''${i + "-" + i + "-" + i}'''`,
          `'''${matches[i]}'''`
        );
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

// route to get random wikipedia article title
router.get("/random", async (req, res) => {
  try {
    const response = await axios.get(
      "https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json"
    );

    const title = response.data.query.random[0].title;

    res.json({ title });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// function to remove text between matching html tags
function removeBetween(text: string, tag: string) {
  // replace <tag /> with <tag></tag>
  // replace self closing tags with opening and closing tags
  text = text.replace(new RegExp(`<${tag}[^<>]*\/>`, "g"), ``);

  // replace <tag> with ⦑
  text = text.replace(new RegExp(`<${tag}[^>\/]*>`, "g"), "⦑");
  // replace </tag> with ⦒
  text = text.replace(new RegExp(`</${tag}>`, "g"), "⦒");

  do {
    const newText = text.replace(/⦑([^⦑⦒]*)⦒/g, "");
    if (newText === text) {
      break;
    }
    text = newText;
  } while (true);

  // capture text between <tag> and </tag>
  const regex = new RegExp(`⦑([^⦑]*)⦒`, "gi");
  const matches = text.match(regex);

  if (matches) {
    for (const match of matches) {
      // remove <tag> and </tag>
      text = text.replace(match, "");
    }
  }

  return text;
}

// function to print first 300 characters of text
function print(text: string) {
  console.log("--------------------");
  console.log(text.slice(0, 700));
}

router.get("/article-info/:name", async (req, res) => {
  // get contents of a wikipedia article
  fetch(
    `https://en.wikipedia.org/w/api.php?format=json&action=query&prop=revisions&rvprop=content&titles=${req.params.name}&redirects=`
    // { responseType: "arraybuffer" }
  )
    .then((response) => response.json())
    .then(async (json) => {
      const page: any = Object.values(json.query.pages)[0];
      if (!page || !page.revisions) {
        return res.status(404).json({ error: "Article not found" });
      }
      let content = page.revisions[0]["*"];

      print(content);

      let answers = getRedirects(content);

      // remove all text between {{ }}
      content = removeParentheses(content);

      print(content);

      // remove all ''''' and replace with '''
      content = content.replace(/'''''/g, "'''");

      print(content);

      // remove all text between ( )
      const regex2 = /\(.*?\)/g;
      content = content.replace(regex2, "");

      print(content);

      // remove all text between <!-- -->
      const regex3 = /<!--.*?-->/g;
      content = content.replace(regex3, "");

      // remove all newlines
      content = content.replace(/\n/g, "");

      print(content);

      // remove all text between ref and /ref
      const regex4 = /<ref.*?\/ref>/g;

      content = removeBetween(content, "ref");

      print(content);

      // remove all text between math and /math
      const regex4_1 = /<math.*?\/math>/g;
      content = removeBetween(content, "math");
      print(content);

      // remove titles
      content = removeTitles(content);
      print(content);

      const contentWithLinks = content;

      // remove links
      content = replaceLinks(content);
      print(content);

      // get first sentence
      const regex5 = / ?[^.!?]+[.!?]+ */g;
      const sentences = content.match(regex5);

      if (!sentences) {
        res.status(404).json({ error: "Article not found" });
        return;
      }
      print(sentences[0]);
      answers.push(...returnBold(sentences[0]));

      // get page title
      const title = page.title;
      if (!answers.includes(title.toLowerCase())) {
        answers.push(title);
      }

      // get page link
      const link = encodeURIComponent(title);

      const userRepository = AppDataSource.getRepository(Question);

      let difficulty, questions;
      // find this question by link in database
      const question = await userRepository.findOne({
        where: { link },
      });

      // if question exists
      if (question) {
        difficulty = question.difficulty;
        questions = JSON.parse(question.questions);
        answers = JSON.parse(question.possibleAnswers);
      } else {
        answers = uniqCaseInsensitive(answers);

        questions = sentences
          //   .map(replaceBold)
          //   .filter(filterBad)
          .map((e) => e.replace(/  /g, " "))
          .map((e) => e.replace(/ \./g, "."))
          .map((e) => replaceAnswers(e, answers))
          .slice(0, 5);
      }

      res.send({
        answers,
        links: returnLinks(contentWithLinks).slice(0, 20),
        questions,
        content,
        link,
        difficulty,
        addedBy: question?.addedBy,
      });
    });
});

// route to add a new question
router.post("/add-question", async (req, res) => {
  const { questions, possibleAnswers, link, difficulty, addedBy } = req.body;

  const userRepository = AppDataSource.getRepository(Question);

  // if link is already in database then don't add
  const question = await userRepository
    .createQueryBuilder("question")
    .where("question.link = :link", { link })
    .getOne();

  if (question) {
    question.difficulty = difficulty;
    question.questions = questions;
    question.possibleAnswers = possibleAnswers;
    question.addedBy = addedBy;

    await userRepository.save(question);

    res.send({ error: "Question already exists" });

    return;
  }

  const newQuestion = new Question();
  newQuestion.questions = questions;
  newQuestion.possibleAnswers = possibleAnswers;
  newQuestion.link = link;
  newQuestion.difficulty = difficulty;
  newQuestion.addedBy = addedBy;

  try {
    await userRepository.save(newQuestion);

    return res.send("Question added");
  } catch (error) {
    return res.status(500).send(error);
  }
});

// route to add a new question
router.post("/get-question", async (req, res) => {
  const { link } = req.body;

  const userRepository = AppDataSource.getRepository(Question);

  // find question by link
  try {
    console.log(link);
    const question = await userRepository
      .createQueryBuilder("question")
      .where("question.link = :link", { link })
      .getOne();

    if (question) {
      return res.send(question);
    } else {
      return res.status(404).send("Question not found");
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});

export default router;
