import { ApiError } from "../utils/ApiError.js";
import { db } from "../libs/db.js";
import {
  getJudge0LanguageId,
  submitBatch,
  pollBatchResults,
} from "../libs/judge0.lib.js";
const createProblem = async (req, res) => {
  // get all data from request body
  const {
    title,
    description,
    difficulty,
    tags,
    examples,
    constraints,
    testcases,
    codeSnippets,
    referenceSolutions,
  } = req.body;
  //check user role once again
  console.log("role in problem", req.user.role);
  if (req.user.role !== "ADMIN") {
    throw new ApiError(403, "You are not allowed to create a problem ");
  }
  //loop through each and every solution

  try {
    for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
      const languageId = getJudge0LanguageId(language);
      if (!languageId) {
        throw new ApiError(400, `Language ${language} is not supported`);
      }

      const submissions = testcases.map(({ input, output }) => ({
        source_code: solutionCode,
        language_id: languageId,
        stdin: input,
        expected_output: output,
      }));

      const submissionResults = await submitBatch(submissions);

      const tokens = submissionResults.map((res) => res.token);
      const results = await pollBatchResults(tokens);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        console.log("Results ----", result);
        console.log(
          `Testcase ${
            i + 1
          } and Language ${language} ------- result ${JSON.stringify(
            result.status.description
          )}`
        );
        if (result.status.id !== 3) {
          return res.status(400).json({
            error: `Testcase ${i + 1} failed 
                    for Language ${language}`,
          });
        }
      }

      //save the problem to the database
      const newProblem = await db.problem.create({
        data: {
          title,
          description,
          difficulty,
          tags,
          examples,
          constraints,
          testcases,
          codeSnippets,
          referenceSolutions,
          userId: req.user.id,
        },
      });

      return res.status(201).json({
        sucess: true,
        message: "Message Created Successfully",
        problem: newProblem,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error While Creating Problems",
    });
  }
};

const getAllProblems = async (req, res) => {
  try {
    const problems = await db.problem.findMany();
    if (!problems) {
      return res.status(404).json({
        error: "No problems Found",
      });
    }
    res.status(200).json({
      success: true,
      message: "All problems are  Fetched Successfully",
      problems,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error While Fetching Problems",
    });
  }
};

const getProblemById = async (req, res) => {
  const { id } = req.params;
  try {
    const problem = await db.problem.findUnique({
      where: {
        id,
      },
    });

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }
    return res.status(200).json({
      success: true,
      message: " A Problem fetched  Successfully",
      problem,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error While Fetching Problem By id",
    });
  }
};

const updateProblem = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    difficulty,
    tags,
    examples,
    constraints,
    testcases,
    codeSnippets,
    referenceSolutions,
  } = req.body;

  try {
    const problem = await db.problem.findUnique({
      where: {
        id,
      },
    });

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
      const languageId = getJudge0LanguageId(language);
      if (!languageId) {
        throw new ApiError(400, `Language ${language} is not supported`);
      }

      const submissions = testcases.map(({ input, output }) => ({
        source_code: solutionCode,
        language_id: languageId,
        stdin: input,
        expected_output: output,
      }));

      const submissionResults = await submitBatch(submissions);

      const tokens = submissionResults.map((res) => res.token);
      const results = await pollBatchResults(tokens);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        console.log("Results ----", result);
        console.log(
          `Testcase ${
            i + 1
          } and Language ${language} ------- result ${JSON.stringify(
            result.status.description
          )}`
        );
        if (result.status.id !== 3) {
          return res.status(400).json({
            error: `Testcase ${i + 1} failed 
                    for Language ${language}`,
          });
        }
      }
    }
    const newProblem = await db.problem.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testcases,
        codeSnippets,
        referenceSolutions,
        userId: req.user.id,
      },
    });

    return res.status(201).json({
      sucess: true,
      message: "Problem Updated Successfully",
      problem: newProblem,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error While Updating Problems",
    });
  }
};


const deleteProblem=async(req,res) =>{
    const{id} = req.params;

    try {
        const problem = await db.problem.findUnique(
            {
                where:{id}
            }
        )
        if(!problem){
            return res.status(400).json({
                error:"Problem not Found"
            })
        }
        await db.problem.delete({
            where: {id}
        })

        res.status(200).json({
            success:true,
            message : "Problem deleted Successfully"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error : "Error while deleting problem"
        })
        
    }

}   


const getAllProblemsSolvedByUser = async(req,res)=>{
    console.log("It hit get all prblemd by solced ")
    try {
  const problems = await db.problem.findMany({
    where:{
        solvedBy:{
            some:{
                userId:req.user.id
            }
        }

    },
    include:{
        solvedBy:{
            where:{
                userId:req.user.id
            }
        }
    }

  })


res.status(200).json({
    success:true,
    message: "Problem fetched successfully",
    problems
})

        
    } catch (error) {
        console.error("Error fetching problem: ",error)
        res.status(500).json({error:"Falied to fetch problems"})
        
    }
}








export { createProblem, getAllProblems, getProblemById, updateProblem,deleteProblem,getAllProblemsSolvedByUser};
