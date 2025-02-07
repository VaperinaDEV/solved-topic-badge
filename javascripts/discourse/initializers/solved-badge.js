import { withPluginApi } from "discourse/lib/plugin-api";
import discourseComputed from "discourse-common/utils/decorators";
import TopicListItem from "discourse/components/topic-list-item";
import LatestTopicListItem from "discourse/components/latest-topic-list-item";

export default {
  name: "solved-badge",

  initialize(container) {
    withPluginApi("1.39.0", api => {
      // Should remove after the glimmer topic list transition
      withSilencedDeprecations("discourse.hbr-topic-list-overrides", () => {
        TopicListItem.reopen({
          @discourseComputed()
          unboundClassNames() {
            let classList = this._super(...arguments);
            if (this.topic.can_have_answer) {
              classList += " solvable";
            }
            return classList;
          },
        });

        LatestTopicListItem.reopen({
          @discourseComputed()
          unboundClassNames() {
            let classList = this._super(...arguments);
            if (this.topic.can_have_answer) {
              classList += " solvable";
            }
            if (this.topic.has_accepted_answer) {
              classList += " status-solved";
            }
            return classList;
          },
        });
      });

      api.registerValueTransformer(
        "topic-list-item-class",
        ({ value, context }) => {
          if (context.topic.get("can_have_answer")) {
            value.push("solvable");
          }
          return value;
        }
      );

      api.registerValueTransformer(
        "latest-topic-list-item-class",
        ({ value, context }) => {
          if (context.topic.get("can_have_answer")) {
            value.push("solvable");
          }
          if (context.topic.get("has_accepted_answer")) {
            value.push("solvable");
          }
          return value;
        }
      );  

      api.onAppEvent("page:topic-loaded", (topic) => {
        if (!topic) {
          return;
        }
        if (topic.can_have_answer) {
          document.body.classList.add("solvable-topic");
        } else {
          document.body.classList.remove("solvable-topic");
        }        
        
        if (topic.accepted_answer) {
          document.body.classList.add("solved-topic");
        } else {
          document.body.classList.remove("solved-topic");
        }        
      });

      api.onAppEvent("header:show-topic", (topic) => {
        const solvedTopic = document.body.classList.contains("solved-topic");
        const solvableTopic = document.body.classList.contains("solvable-topic");
        
        if (topic.accepted_answer) {
          if (!solvedTopic) {
            document.body.classList.add("solved-topic");
          }
        }

        const acceptedButton = document.querySelector("button.accepted");
        this.siteSettings = container.lookup("service:site-settings");
        
        acceptedButton?.addEventListener("click", () => {
          if (!solvableTopic && this.siteSettings.empty_box_on_unsolved) {
            document.body.classList.add("solvable-topic");
          }
          if (solvedTopic) {
            document.body.classList.remove("solved-topic");
          }
        });
      });

      api.onPageChange((url, title) => {
        const solvableTopic = document.body.classList.contains("solvable-topic");
        const solvedTopic = document.body.classList.contains("solved-topic");
        const topicPage = document.body.classList.contains("archetype-regular");

        if (!topicPage && solvableTopic) {
          document.body.classList.remove("solvable-topic");
        }
        if (!topicPage && solvedTopic) {
          document.body.classList.remove("solved-topic");
        }        
      });      
    });
  }
};
