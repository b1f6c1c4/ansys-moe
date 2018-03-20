package ansysd

var ansysPath string

// Entry setup ansysd
// logger: write string to console or file.
func Entry(logger func(string)) {
	ansysPath = findAnsysExecutable()
	logger("Ansys path: " + ansysPath)
}
