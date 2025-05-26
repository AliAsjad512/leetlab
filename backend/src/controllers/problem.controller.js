import { ApiError } from "../utils/ApiError.js"
import { db } from "../libs/db.js"
import {getJudge0LanguageId,submitBatch,pollBatchResults} from "../libs/judge0.lib.js"
const createProblem = async(req,res) =>{
// get all data from request body
const {title, description, difficulty, tags, examples, constraints, testcases, codeSnippets, referenceSolutions} = req.body
//check user role once again
console.log("role in problem",req.user.role);
if(req.user.role !== "ADMIN"){
    throw new ApiError(403,"You are not allowed to create a problem ")
}
//loop through each and every solution

try {
    for(const [language, solutionCode] of Object.entries(referenceSolutions)){
    const languageId=getJudge0LanguageId(language)
    if(!languageId){
        throw new ApiError(400,`Language ${language} is not supported`);
        
    }

    const submissions = testcases.map(({input, output}) =>({
        source_code:solutionCode,
        language_id : languageId,
        stdin:input,
        expected_output:output,
    }))
    
    const submissionResults = await submitBatch(submissions)
    
    const tokens = submissionResults.map((res) =>res.token);
    const results = await pollBatchResults(tokens)

    for(let i=0;i<results.length;i++){
       
        const result = results[i];
         console.log("Result-------",result)
        if(result.status.id !==3 ){
            return res.status(400).json(
                {
                    error: `Testcase ${i+1} failed 
                    for Language ${language}`
                }
            )
        }
    }

    //save the problem to the database
    const newProblem = await db.problem.create({
        data:{
            title, description, difficulty, tags, examples, 
            constraints, testcases, codeSnippets, 
            referenceSolutions,userId:req.user.id

        }
    })

 return res.status(201).json(newProblem);

    
    }
    
} catch (error) {
    console.log(error);
    return res.status(500).json({
        error : "Error While Creating Problems"
    })
    
}



}


export {createProblem}