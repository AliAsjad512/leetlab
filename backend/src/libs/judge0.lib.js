import axios from "axios";
 const getJudge0LanguageId = (Language) =>{
  const languageMap = {
    "PYTHON" :71,
    "JAVA" :62,
    "JAVASCRIPT":63,
  }  

  return languageMap[Language.toUpperCase()] || null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve,ms))
const pollBatchResults = async(tokens) =>{
    while(true){
        const { data} = await axios.get(`${process.env.JUDGE0_API_URL}/submissions/batch`,{
           params:{
            tokens:tokens.join(","),
            base64_encoded:false,
           } 
        })
        const results = data.submissions

        const isAllDone = results.every(
          (r) => r.status.id !==1 && r.status.id !==2  )

          if(isAllDone) return results
          await sleep(1000)
    }
}

const submitBatch = async(submissions)=>{
   const {data} = await axios.post(`${process.env.JUDGE0_API_URL}/submissions/batch?base64_encoded=false`,{
    submissions
   }) 

console.log("Submission Results: ",data)
return data

}

const getLanguageName = async(LanguageId)=>{
  const LANGUAGE_NAMES = {
    74 : "TypeScript",
    63 : "JavaScript",
    71 :  "Python",
    62 :  "Java"
  }
  return LANGUAGE_NAMES[LanguageId] || "Unknown"

}


export {getJudge0LanguageId,submitBatch,pollBatchResults,getLanguageName} ;