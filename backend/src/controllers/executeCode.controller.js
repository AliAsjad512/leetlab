import { db } from "../libs/db.js";
import { pollBatchResults, submitBatch,getLanguageName } from "../libs/judge0.lib.js";

const executeCode = async(req, res)=>{
    try {
     const{source_code,language_id, stdin, expected_outputs, problemId} = req.body;
     const userId = req.user.id;


     if(!Array.isArray(stdin) || stdin.length===0 || !Array.isArray(expected_outputs) 
    || expected_outputs.length !==stdin.length){
return  res.status(400).json({error:"Invalid or Missing test cases"})
}
//2.Prepare each test cases fpr judeg0 batch submission

const submissions =stdin.map((input) =>({

source_code,
language_id,
stdin:input,


}))
//3.send batch of submissions to judge0
const submitResponse = await submitBatch(submissions);
const tokens = submitResponse.map((res)=>res.token);
//4.Poll judge0 for results of all submitted test cases

const results= await pollBatchResults(tokens)
    console.log("Results----")
    console.log(results);
  let allPassed = true;
  const detailedResults = results.map((result,i) =>{
    const stdout = result.stdout?.trim();
    const expected_output = expected_outputs[i]?.trim();
    const passed = stdout === expected_output;
    if(!passed) allPassed = false;

    return {
        testCase:i+1,
        passed,
        stdout,
        expected:expected_output,
        stderr:result.stderr || null,
        compile_output:result.compile_output,
        status:result.status.description,
        memory:result.memory ? `${result.memory} KB` : undefined,
        time:result.time ? `${result.time}` : undefined
    }

    // console.log(`Testcase #${i+1}:`);
    // console.log(`Input #${i+1}:${stdin[i]}`);
    // console.log(`Expected Output for testcase #${i+1}: ${expected_output}`);
    // console.log(`Actual output #${i+1}: ${stdout}`);
    // console.log(`Matched #${i+1}: ${passed}`)
  })

  console.log(detailedResults);
// store submission summary

const submission = await db.submission.create({
    data: {
        userId,
        problemId,
        sourceCode:source_code,
        language:await getLanguageName(language_id),
        stdin :stdin.join("\n"),
        stdout:JSON.stringify(detailedResults.map((r)=>r.stdout)),
        stderr : detailedResults.some((r) =>r.stderr) ? JSON.stringify(detailedResults.map((r) =>r.stderr)) : null,
        compileOutput:detailedResults.some((r) =>r.compile_output) ? JSON.stringify(detailedResults.map((r) =>r.compile_output)) : null,
         status:allPassed ? "Accepted" : "Wrong Answer",
         memory : detailedResults.some((r) =>r.memory) ? JSON.stringify(detailedResults.map((r) =>r.memory)) : null,
         time : detailedResults.some((r) =>r.time) ? JSON.stringify(detailedResults.map((r) =>r.time)) : null,
    }
})

//If All passed=true mark problem as solved for current user
if(allPassed){
    await db.problemSolved.upsert({
        where : {
            userId_problemId : {
                userId,problemId
            }
        },
        update:{},
        create: {
            userId,problemId
        }
    })
}

//8. Save individual test case results using detailedResults

const testCaseResults =  detailedResults.map((result)=>({
    submissionId:submission.id,
    testCase:result.testCase,
    passed:result.passed,
    stdout:result.stdout,
    expected:result.expected,
    stderr:result.stderr,
    compileOutput:result.compile_output,
    status:result.status,
    memory:result.memory,
    time:result.time

}))

await db.testCaseResult.createMany({
    data:testCaseResults
})

const submissionWithTestCase = await db.submission.findUnique({
    where:{
        id:submission.id
    },
    include:{
        testCases:true
    }
})




    res.status(200).json({
        success:true,
        message: "Code Executed! Successfully!",
        submission:submissionWithTestCase
    });

    } catch (error) {
        console.error('Error executing code:',error.message);
        res.status(500).json({error:'Failed to execute code'});
        
    }

}

export default executeCode;