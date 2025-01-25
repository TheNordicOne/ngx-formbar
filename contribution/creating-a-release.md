# Creating a release

Following are the steps for creating a release, including how it is published.

1. On the main branch, got to Actions in the GitHub UI
2. Select the " Create Release PR" pipeline and manually trigger it
   - unless there is a good reason to override the version bump type, leave it at "auto"
3. A release PR will be created, that includes the "release" label and commits for the version bump
4. Review the changes and wait for the Test and Lint workflow to pass
5. If everything is okay, merge the PR via "Rebase merge"
6. Successful merge will run the "Create Release" pipeline
7. Once the release is created and published, the "Publish" pipeline will run and publish the package to npm
