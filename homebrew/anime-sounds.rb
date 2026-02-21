class AnimeSounds < Formula
  desc "Anime-themed sound effects for Claude Code hooks"
  homepage "https://github.com/anthropics/claude-code-anime-sounds"
  url "https://registry.npmjs.org/claude-code-anime-sounds/-/claude-code-anime-sounds-1.0.0.tgz"
  sha256 "PLACEHOLDER"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "anime-sounds", shell_output("#{bin}/anime-sounds help")
    assert_match "install", shell_output("#{bin}/anime-sounds help")
  end

  def caveats
    <<~EOS
      运行以下命令注入 hooks：
        anime-sounds install
    EOS
  end
end
