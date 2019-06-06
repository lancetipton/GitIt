const ALLOWED_PARAMS = [
  'commit',
  'files'
]
let REPO
let BRANCH = {}


/**
 * Sets the current commit's SHA
 * @private
 * 
 * @return { Promise }
 */
const getCurrentCommitSHA = () => (
  REPO
    .getRef('heads/' + BRANCH.name)
    .then(ref => BRANCH.commitSHA = ref.data.object.sha)
)

/**
 * Sets the current commit tree's SHA
 * @private
 * 
 * @return { Promise }
 */
const getCurrentTreeSHA = () => (
  REPO
    .getCommit(BRANCH.commitSHA)
    .then(commit => BRANCH.treeSHA = commit.data.tree.sha)
)

/**
 * Creates blobs for all passed files
 * @private
 * @param  { object []} filesInfo Array of objects (with keys 'content' and 'path'),
 *                              containing data to push
 * 
 * @return { Promise }
 */
const createFiles = (gitIt, filesInfo) => (
  Promise.all(
    Array
      .from(filesInfo)
      .map(fileInfo => createFile(gitIt, fileInfo))
  )
)

/**
 * Creates a blob for a single file
 * @private
 * @param  { object } fileInfo Array of objects (with keys 'content' and 'path'),
 *                           containing data to push
 * 
 * @return { Promise }
 */
const createFile = (gitIt, fileInfo) => (
  REPO
    .createBlob(fileInfo.content)
    .then(blob => (
      gitIt.files.push({
        sha: blob.data.sha,
        path: fileInfo.path,
        mode: '100644',
        type: 'blob'
      })
    ))
)

/**
 * Creates a new tree
 * @private
 * 
 * @return { Promise }
 */
const createTree = gitIt => (
  REPO
    .createTree(gitIt.files, BRANCH.treeSHA)
    .then(tree => commit.treeSHA = tree.data.sha)
)

/**
 * Creates a new commit
 * @private
 * @param  { string } message A message for the commit
 * 
 * @return { Promise }
 */
const createCommit = message => (
  REPO
    .commit(BRANCH.commitSHA, commit.treeSHA, message)
    .then(commit => commit.sha = commit.data.sha)
)

/**
 * Updates the pointer of the current branch to point the newly created commit
 * @private
 * @return { Promise }
 */
const updateHead = () => (
  REPO.updateHead('heads/' + BRANCH.name, commit.sha)
)


const setupGitIt = () => {

  class GitIt{
    
    constructor(params){
      if(!params.auth)
        throw 'params.auth is required!'
      
      this.api = new GitHub(params.auth)
      ALLOWED_PARAMS.map(name => params[name] && (this[name] = params[name]))
    }

    files = []
    commit = {}

    /**
     * Sets the current repository to make push to
     * @public
     * @param { string } userName Name of the user who owns the repository
     * @param { string } repoName Name of the repository
     * 
     * @return { void }
     */
    repo = (userName, repoName) => {
      repoName && (REPO = this.api.getRepo(userName, repoName))

      return REPO
    }

    /**
     * Sets the current branch to make push to. If the branch doesn't exist yet,
     * it will be created first
     * @public
     * @param { string } branchName The name of the branch
     * 
     * @return { Promise }
     */
    branch = branchName => {
      if (!REPO)
        throw 'Repository is not initialized'

      if(!branchName) return BRANCH

      return REPO
        .listBranches()
        .then(branches => {
          const branchExists = branches
            .data
            .find(branch => branch.name === branchName )

          if (branchExists)
            this.branch.name = branchName

          return REPO
            .createBranch('master', branchName)
            .then(() => this.branch.name = branchName)
        })
    }


    /**
     * Makes the push to the currently set branch
     * @public
     * @param  { string }  message - Message of the commit
     * @param  { object } files - Array of objects (with keys 'content' and 'path'),
     *                            containing data to push
     * @return { Promise }
     */
    push = (message, files) => {
      if (!repo)
        throw 'Repository is not initialized'
        
      if (!this.branch.hasOwnProperty('name'))
        throw 'Branch is not set'

      return getCurrentCommitSHA()
        .then(() => getCurrentTreeSHA(this))
        .then(() => createFiles(this, files))
        .then(() => createTree(this))
        .then(() => createCommit(this, message))
        .then(() => updateHead(this))
        .catch(e => console.error(e))
    }

    /**
     * Clears the GitIt internal data based on passed in params
     * @public
     * @param  {  string  || undefined } type - name of that to clear
     * 
     * @return { void }
     */
    clear = type => {
      if(!type || type === 'files') this.files = []
      if(!type || type === 'commit') this.commit = {}
      if(type) return

      REPO = undefined
      BRANCH = undefined
    }

  }

}